import crypto from "crypto";
import { encryptSecret, decryptSecret, EncryptedData } from "./crypto";
import { prisma } from "./db";
import { logger } from "./logger";

// Strict redirect URI allowlist to prevent open redirect vulnerabilities
const ALLOWED_REDIRECT_URIS = [
  "http://localhost:3000/api/auth/callback/github",
  "http://localhost:3000/api/auth/callback/google",
  "http://localhost:3000/api/auth/callback/linkedin",
];

export interface OAuthStatePayload {
  stateToken: string;
  provider: string;
  createdAt: number;
}

// In-memory or cache state store with 10-minute TTL for CSRF prevention
const activeStates = new Map<string, OAuthStatePayload>();

/**
 * Generates a cryptographically secure CSRF state token for OAuth flows.
 */
export function generateOAuthState(provider: string): string {
  const stateToken = crypto.randomBytes(32).toString("hex");
  activeStates.set(stateToken, {
    stateToken,
    provider,
    createdAt: Date.now(),
  });
  return stateToken;
}

/**
 * Validates the state token returned by the OAuth provider callback.
 */
export function validateOAuthState(stateToken: string, expectedProvider: string): boolean {
  if (!stateToken || !activeStates.has(stateToken)) {
    return false;
  }

  const payload = activeStates.get(stateToken)!;
  activeStates.delete(stateToken); // Single-use consumption

  // Check 10-minute expiration
  const isExpired = Date.now() - payload.createdAt > 10 * 60 * 1000;
  if (isExpired) {
    return false;
  }

  return payload.provider.toUpperCase() === expectedProvider.toUpperCase();
}

/**
 * Validates that the OAuth redirect URI belongs to the approved allowlist.
 */
export function validateRedirectUri(redirectUri: string): boolean {
  return ALLOWED_REDIRECT_URIS.includes(redirectUri);
}

/**
 * Stores an OAuth token securely with AES-256-GCM encryption in PostgreSQL.
 */
export async function storeEncryptedToken(
  userId: string,
  provider: "GITHUB" | "GMAIL" | "LINKEDIN",
  externalAccountId: string,
  accessToken: string,
  refreshToken?: string,
  expiresInSeconds?: number,
  scopes: string[] = []
): Promise<void> {
  const encAccess = encryptSecret(accessToken);
  const encRefresh = refreshToken ? encryptSecret(refreshToken) : null;
  const expiresAt = expiresInSeconds ? new Date(Date.now() + expiresInSeconds * 1000) : null;

  await prisma.connectedAccount.upsert({
    where: {
      provider_externalAccountId: {
        provider,
        externalAccountId,
      },
    },
    update: {
      encryptedAccessToken: encAccess.encryptedText,
      encryptedRefreshToken: encRefresh ? encRefresh.encryptedText : undefined,
      tokenIv: encAccess.iv,
      tokenAuthTag: encAccess.authTag,
      grantedScopes: scopes,
      connectionState: "CONNECTED",
      expiresAt,
      lastSyncAt: new Date(),
    },
    create: {
      userId,
      provider,
      externalAccountId,
      encryptedAccessToken: encAccess.encryptedText,
      encryptedRefreshToken: encRefresh ? encRefresh.encryptedText : null,
      tokenIv: encAccess.iv,
      tokenAuthTag: encAccess.authTag,
      grantedScopes: scopes,
      connectionState: "CONNECTED",
      expiresAt,
      lastSyncAt: new Date(),
    },
  });

  logger.info("OAUTH", `Securely stored encrypted tokens for provider ${provider}`, {
    provider,
    externalAccountId,
    expiresAt,
  });
}

/**
 * Retrieves and decrypts the access token for a connected account.
 */
export async function getDecryptedAccessToken(
  provider: string,
  externalAccountId: string
): Promise<string | null> {
  const account = await prisma.connectedAccount.findUnique({
    where: {
      provider_externalAccountId: {
        provider,
        externalAccountId,
      },
    },
  });

  if (!account) {
    return null;
  }

  if (account.connectionState === "REVOKED" || account.connectionState === "DISCONNECTED") {
    throw new Error(`Account access has been ${account.connectionState}`);
  }

  if (!account.encryptedAccessToken || !account.tokenIv || !account.tokenAuthTag) {
    return null;
  }

  if (account.expiresAt && new Date() > account.expiresAt) {
    throw new Error("Access token has expired. Rotation required.");
  }

  const encData: EncryptedData = {
    encryptedText: account.encryptedAccessToken,
    iv: account.tokenIv,
    authTag: account.tokenAuthTag,
  };

  return decryptSecret(encData);
}

/**
 * Disconnects an account, clears encrypted secrets, and marks state as DISCONNECTED.
 */
export async function disconnectAccount(
  userId: string,
  provider: string,
  externalAccountId: string
): Promise<void> {
  await prisma.connectedAccount.updateMany({
    where: {
      userId,
      provider,
      externalAccountId,
    },
    data: {
      encryptedAccessToken: null,
      encryptedRefreshToken: null,
      tokenIv: null,
      tokenAuthTag: null,
      connectionState: "DISCONNECTED",
      integrationMode: "DEMO",
      lastSyncAt: new Date(),
    },
  });

  await prisma.auditEvent.create({
    data: {
      userId,
      actorType: "USER",
      moduleName: "AUTH",
      actionName: "ACCOUNT_DISCONNECTED",
      targetResource: `${provider}:${externalAccountId}`,
      status: "SUCCESS",
      detailsRedacted: JSON.stringify({ provider, state: "DISCONNECTED" }),
    },
  });

  logger.info("OAUTH", `Disconnected account ${provider}:${externalAccountId}`);
}
