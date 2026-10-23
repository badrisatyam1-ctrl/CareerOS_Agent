import { NextResponse } from "next/server";
import { validateOAuthState, storeEncryptedToken } from "@/lib/oauth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (error) {
    logger.error("LINKEDIN_OAUTH_CALLBACK", `LinkedIn returned error: ${error}`, { errorDesc });
    return NextResponse.redirect(`${baseUrl}/settings?error=${encodeURIComponent(errorDesc || error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/settings?error=missing_oauth_parameters`);
  }

  // 1. Verify CSRF state token
  const isStateValid = validateOAuthState(state, "LINKEDIN");
  if (!isStateValid) {
    logger.warn("LINKEDIN_OAUTH_CALLBACK", "OAuth state mismatch or expired CSRF token");
    return NextResponse.redirect(`${baseUrl}/settings?error=invalid_csrf_state`);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/settings?error=linkedin_credentials_not_configured`);
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/callback/linkedin`;

    // 2. Exchange authorization code for access token via LinkedIn OAuth token endpoint
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`LinkedIn token exchange failed (HTTP ${tokenRes.status}): ${errText}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string;
    const expiresIn = tokenData.expires_in as number;
    const grantedScopeStr = (tokenData.scope as string) || "";
    const grantedScopes = grantedScopeStr.split(/[,\s]+/).filter(Boolean);

    // 3. Fetch authenticated member identity via OpenID userinfo endpoint
    let externalAccountId = "linkedin-user";
    try {
      const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (profileRes.ok) {
        const profile = await profileRes.json();
        externalAccountId = profile.sub || profile.name || externalAccountId;
      }
    } catch (profileErr: unknown) {
      logger.warn("LINKEDIN_OAUTH_CALLBACK", "Failed to fetch OpenID userinfo profile, using default ID", {
        error: String(profileErr),
      });
    }

    // 4. Ensure owner UserProfile exists
    let owner = await prisma.userProfile.findFirst();
    if (!owner) {
      owner = await prisma.userProfile.create({
        data: {
          id: "owner-badri-pandey",
          email: "badrivishal.pandey@gmail.com",
          fullName: "Badri Vishal Pandey",
        },
      });
    }

    // 5. Encrypt and store tokens in PostgreSQL
    await storeEncryptedToken(
      owner.id,
      "LINKEDIN",
      externalAccountId,
      accessToken,
      tokenData.refresh_token,
      expiresIn,
      grantedScopes
    );

    // 6. Set initial mode based on whether official member social publishing is granted
    const hasSocialPublish = grantedScopes.includes("w_member_social");
    const initialMode = hasSocialPublish ? "REAL_APPROVAL_REQUIRED" : "REAL_DRAFT_ONLY";

    await prisma.connectedAccount.updateMany({
      where: {
        provider: "LINKEDIN",
        externalAccountId,
      },
      data: {
        integrationMode: initialMode,
      },
    });

    // 7. Audit log
    await prisma.auditEvent.create({
      data: {
        userId: owner.id,
        actorType: "USER",
        moduleName: "AUTH",
        actionName: "LINKEDIN_CONNECTED",
        targetResource: `LINKEDIN:${externalAccountId}`,
        status: "SUCCESS",
        detailsRedacted: JSON.stringify({
          scopes: grantedScopes,
          mode: initialMode,
          hasSocialPublish,
        }),
      },
    });

    logger.info("LINKEDIN_OAUTH_CALLBACK", `Successfully connected LinkedIn account: ${externalAccountId}`, {
      mode: initialMode,
      hasSocialPublish,
    });

    return NextResponse.redirect(`${baseUrl}/settings?connected=linkedin&mode=${initialMode}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("LINKEDIN_OAUTH_CALLBACK", `OAuth callback error: ${message}`);
    return NextResponse.redirect(`${baseUrl}/settings?error=${encodeURIComponent(message)}`);
  }
}
