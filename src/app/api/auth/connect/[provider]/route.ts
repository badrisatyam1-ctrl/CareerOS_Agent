import { NextResponse } from "next/server";
import { generateOAuthState } from "@/lib/oauth";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ provider: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { provider } = await params;
  const p = provider.toUpperCase();

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (p === "GITHUB") {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "GITHUB_CLIENT_ID not configured in environment" },
        { status: 400 }
      );
    }

    const state = generateOAuthState("GITHUB");
    const redirectUri = `${baseUrl}/api/auth/callback/github`;
    const scopes = ["read:user", "repo"].join(" ");

    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);

    logger.info("OAUTH_CONNECT", "Initiating GitHub OAuth flow", { redirectUri });
    return NextResponse.redirect(authUrl.toString());
  }

  if (p === "GOOGLE" || p === "GMAIL") {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "GOOGLE_CLIENT_ID not configured in environment" },
        { status: 400 }
      );
    }

    const state = generateOAuthState("GMAIL");
    const redirectUri = `${baseUrl}/api/auth/callback/google`;
    const scopes = [
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" ");

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    logger.info("OAUTH_CONNECT", "Initiating Google/Gmail OAuth flow", { redirectUri });
    return NextResponse.redirect(authUrl.toString());
  }

  if (p === "LINKEDIN") {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        {
          error: "LINKEDIN_CLIENT_ID not configured in environment. CareerOS defaults to Manual Handoff Mode for LinkedIn posts and connection notes.",
        },
        { status: 400 }
      );
    }

    const state = generateOAuthState("LINKEDIN");
    const redirectUri = `${baseUrl}/api/auth/callback/linkedin`;
    const scopes = ["openid", "profile", "email", "w_member_social"].join(" ");

    const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", state);

    logger.info("OAUTH_CONNECT", "Initiating LinkedIn OAuth flow", { redirectUri });
    return NextResponse.redirect(authUrl.toString());
  }

  return NextResponse.json(
    { error: `Provider ${provider} is not supported for OAuth connect` },
    { status: 400 }
  );
}
