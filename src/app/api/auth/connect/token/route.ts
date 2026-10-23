import { NextResponse } from "next/server";
import { storeEncryptedToken } from "@/lib/oauth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, token } = body;

    if (!provider || !token || typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Provider and token are required" },
        { status: 400 }
      );
    }

    const p = provider.toUpperCase();

    if (p === "GITHUB") {
      const cleanToken = token.trim();

      // 1. Validate token against GitHub official API
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${cleanToken}`,
          "User-Agent": "CareerOS/1.0",
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!userRes.ok) {
        const errorText = await userRes.text();
        logger.warn("TOKEN_CONNECT", "GitHub token validation failed", {
          status: userRes.status,
          error: errorText,
        });
        return NextResponse.json(
          {
            success: false,
            error: `GitHub token rejected (HTTP ${userRes.status}). Please check that the token is valid and not expired.`,
          },
          { status: 401 }
        );
      }

      const githubUser = (await userRes.json()) as { login: string; html_url?: string; email?: string };
      const externalAccountId = githubUser.login;

      // Extract scopes from GitHub response headers
      const scopeHeader = userRes.headers.get("x-oauth-scopes") || "";
      const grantedScopes = scopeHeader
        ? scopeHeader.split(",").map((s) => s.trim()).filter(Boolean)
        : ["read:user", "repo"];

      // 2. Ensure owner UserProfile exists
      let owner = await prisma.userProfile.findFirst();
      if (!owner) {
        owner = await prisma.userProfile.create({
          data: {
            id: "owner-badri-pandey",
            email: githubUser.email || "badrivishal.pandey@gmail.com",
            fullName: "Badri Vishal Pandey",
            githubUrl: githubUser.html_url || `https://github.com/${externalAccountId}`,
          },
        });
      }

      // 3. Store encrypted token using AES-256-GCM
      await storeEncryptedToken(
        owner.id,
        "GITHUB",
        externalAccountId,
        cleanToken,
        undefined,
        undefined,
        grantedScopes
      );

      // 4. Set safe default mode: REAL_CONNECTED_READ_ONLY
      await prisma.connectedAccount.updateMany({
        where: {
          provider: "GITHUB",
          externalAccountId,
        },
        data: {
          integrationMode: "REAL_CONNECTED_READ_ONLY",
          connectionState: "CONNECTED",
          lastSyncAt: new Date(),
        },
      });

      // 5. Append-only audit trail
      await prisma.auditEvent.create({
        data: {
          userId: owner.id,
          actorType: "USER",
          moduleName: "AUTH",
          actionName: "GITHUB_TOKEN_CONNECTED",
          targetResource: `GITHUB:${externalAccountId}`,
          status: "SUCCESS",
          detailsRedacted: JSON.stringify({
            scopes: grantedScopes,
            mode: "REAL_CONNECTED_READ_ONLY",
            authMethod: "FINE_GRAINED_TOKEN",
          }),
        },
      });

      logger.info("TOKEN_CONNECT", `Connected GitHub account ${externalAccountId} in REAL_CONNECTED_READ_ONLY`);

      return NextResponse.json({
        success: true,
        provider: "GITHUB",
        username: externalAccountId,
        mode: "REAL_CONNECTED_READ_ONLY",
        scopes: grantedScopes,
      });
    }

    return NextResponse.json(
      { success: false, error: `Token connection not supported for provider ${provider}` },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("TOKEN_CONNECT", `Token connect failed: ${message}`);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
