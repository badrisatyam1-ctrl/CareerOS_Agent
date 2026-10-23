import { NextResponse } from "next/server";
import { google } from "googleapis";
import { validateOAuthState, storeEncryptedToken } from "@/lib/oauth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (error) {
    logger.error("GOOGLE_OAUTH_CALLBACK", `Provider returned error: ${error}`);
    return NextResponse.redirect(`${baseUrl}/settings?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/settings?error=missing_oauth_parameters`);
  }

  // 1. Verify CSRF state token
  const isStateValid = validateOAuthState(state, "GMAIL");
  if (!isStateValid) {
    logger.warn("GOOGLE_OAUTH_CALLBACK", "OAuth state mismatch or expired token");
    return NextResponse.redirect(`${baseUrl}/settings?error=invalid_csrf_state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/settings?error=google_credentials_not_configured`);
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/callback/google`;
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // 2. Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.access_token) {
      throw new Error("Google OAuth did not return an access token");
    }

    // 3. Fetch user email
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userinfo = await oauth2.userinfo.get();
    const externalAccountId = userinfo.data.email || "primary-gmail-account";

    // 4. Ensure owner UserProfile exists
    let owner = await prisma.userProfile.findFirst();
    if (!owner) {
      owner = await prisma.userProfile.create({
        data: {
          id: "owner-badri-pandey",
          email: externalAccountId,
          fullName: userinfo.data.name || "Badri Vishal Pandey",
        },
      });
    }

    // Calculate expiry in seconds
    const expiresInSeconds = tokens.expiry_date
      ? Math.max(0, Math.floor((tokens.expiry_date - Date.now()) / 1000))
      : undefined;

    const grantedScopes = (tokens.scope || "").split(" ").map((s) => s.trim()).filter(Boolean);

    // 5. Encrypt and store tokens in PostgreSQL
    await storeEncryptedToken(
      owner.id,
      "GMAIL",
      externalAccountId,
      tokens.access_token,
      tokens.refresh_token || undefined,
      expiresInSeconds,
      grantedScopes
    );

    // 6. Set initial safe integration mode: REAL_DRAFT_ONLY
    await prisma.connectedAccount.updateMany({
      where: {
        provider: "GMAIL",
        externalAccountId,
      },
      data: {
        integrationMode: "REAL_DRAFT_ONLY",
      },
    });

    // 7. Audit log
    await prisma.auditEvent.create({
      data: {
        userId: owner.id,
        actorType: "USER",
        moduleName: "AUTH",
        actionName: "GMAIL_CONNECTED",
        targetResource: `GMAIL:${externalAccountId}`,
        status: "SUCCESS",
        detailsRedacted: JSON.stringify({
          scopes: grantedScopes,
          mode: "REAL_DRAFT_ONLY",
        }),
      },
    });

    logger.info("GOOGLE_OAUTH_CALLBACK", `Successfully connected Gmail account: ${externalAccountId}`);
    return NextResponse.redirect(`${baseUrl}/settings?connected=gmail&mode=REAL_DRAFT_ONLY`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("GOOGLE_OAUTH_CALLBACK", `OAuth callback error: ${message}`);
    return NextResponse.redirect(`${baseUrl}/settings?error=${encodeURIComponent(message)}`);
  }
}
