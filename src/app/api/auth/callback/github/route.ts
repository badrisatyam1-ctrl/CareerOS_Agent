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
    logger.error("GITHUB_OAUTH_CALLBACK", `Provider returned error: ${error}`, { errorDesc });
    return NextResponse.redirect(`${baseUrl}/settings?error=${encodeURIComponent(errorDesc || error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/settings?error=missing_oauth_parameters`);
  }

  // 1. Verify CSRF state token
  const isStateValid = validateOAuthState(state, "GITHUB");
  if (!isStateValid) {
    logger.warn("GITHUB_OAUTH_CALLBACK", "OAuth state mismatch or expired token");
    return NextResponse.redirect(`${baseUrl}/settings?error=invalid_csrf_state`);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/settings?error=github_credentials_not_configured`);
  }

  try {
    // 2. Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${baseUrl}/api/auth/callback/github`,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed with HTTP ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token as string;
    const scopeString = (tokenData.scope as string) || "";
    const grantedScopes = scopeString.split(",").map((s) => s.trim()).filter(Boolean);

    // 3. Fetch authenticated user profile from GitHub
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
        "User-Agent": "CareerOS/1.0",
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userRes.ok) {
      throw new Error(`Failed to fetch user profile: HTTP ${userRes.status}`);
    }

    const githubUser = await userRes.json();
    const externalAccountId = githubUser.login as string;

    // 4. Ensure owner UserProfile exists
    let owner = await prisma.userProfile.findFirst();
    if (!owner) {
      owner = await prisma.userProfile.create({
        data: {
          id: "owner-badri-pandey",
          email: "badrivishal.pandey@gmail.com",
          fullName: "Badri Vishal Pandey",
          githubUrl: githubUser.html_url || `https://github.com/${externalAccountId}`,
        },
      });
    }

    // 5. Encrypt and store tokens in PostgreSQL
    await storeEncryptedToken(
      owner.id,
      "GITHUB",
      externalAccountId,
      accessToken,
      undefined,
      undefined,
      grantedScopes
    );

    // 6. Set initial safe integration mode: REAL_CONNECTED_READ_ONLY
    await prisma.connectedAccount.updateMany({
      where: {
        provider: "GITHUB",
        externalAccountId,
      },
      data: {
        integrationMode: "REAL_CONNECTED_READ_ONLY",
      },
    });

    // 7. Audit log
    await prisma.auditEvent.create({
      data: {
        userId: owner.id,
        actorType: "USER",
        moduleName: "AUTH",
        actionName: "GITHUB_CONNECTED",
        targetResource: `GITHUB:${externalAccountId}`,
        status: "SUCCESS",
        detailsRedacted: JSON.stringify({
          scopes: grantedScopes,
          mode: "REAL_CONNECTED_READ_ONLY",
        }),
      },
    });

    logger.info("GITHUB_OAUTH_CALLBACK", `Successfully connected GitHub account: ${externalAccountId}`);
    return NextResponse.redirect(`${baseUrl}/settings?connected=github&mode=REAL_CONNECTED_READ_ONLY`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("GITHUB_OAUTH_CALLBACK", `OAuth callback error: ${message}`);
    return NextResponse.redirect(`${baseUrl}/settings?error=${encodeURIComponent(message)}`);
  }
}
