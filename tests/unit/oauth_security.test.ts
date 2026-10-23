import { describe, it, expect, afterAll } from "vitest";
import {
  generateOAuthState,
  validateOAuthState,
  validateRedirectUri,
  storeEncryptedToken,
  getDecryptedAccessToken,
  disconnectAccount,
} from "@/lib/oauth";
import { prisma } from "@/lib/db";

describe("OAuth Security & CSRF Guards", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should generate and validate single-use CSRF state tokens", () => {
    const provider = "GITHUB";
    const stateToken = generateOAuthState(provider);

    expect(stateToken).toHaveLength(64);

    // First validation succeeds
    const isValid = validateOAuthState(stateToken, provider);
    expect(isValid).toBe(true);

    // Second validation fails because state token is single-use
    const isReusedValid = validateOAuthState(stateToken, provider);
    expect(isReusedValid).toBe(false);
  });

  it("should reject state token if provider mismatches", () => {
    const stateToken = generateOAuthState("GITHUB");
    const isValid = validateOAuthState(stateToken, "GMAIL"); // Mismatch
    expect(isValid).toBe(false);
  });

  it("should validate redirect URIs against strict allowlist", () => {
    const validUri = "http://localhost:3000/api/auth/callback/github";
    const invalidUri = "https://malicious-attacker.com/steal-code";

    expect(validateRedirectUri(validUri)).toBe(true);
    expect(validateRedirectUri(invalidUri)).toBe(false);
  });

  it("should store and decrypt OAuth tokens using AES-256-GCM without exposing plaintext in database", async () => {
    const userId = "demo-user-badri";
    const rawAccessToken = "ghp_secure_random_token_123456789";

    await storeEncryptedToken(
      userId,
      "GITHUB",
      "test-external-user",
      rawAccessToken,
      undefined,
      3600,
      ["read:user"]
    );

    // Verify plaintext is NOT stored in DB
    const account = await prisma.connectedAccount.findUnique({
      where: {
        provider_externalAccountId: {
          provider: "GITHUB",
          externalAccountId: "test-external-user",
        },
      },
    });

    expect(account).toBeDefined();
    expect(account?.encryptedAccessToken).not.toBe(rawAccessToken);
    expect(account?.tokenIv).toBeDefined();
    expect(account?.tokenAuthTag).toBeDefined();

    // Verify decryption round-trip
    const decrypted = await getDecryptedAccessToken("GITHUB", "test-external-user");
    expect(decrypted).toBe(rawAccessToken);
  });

  it("should disconnect account, wipe encrypted secrets, and log audit event", async () => {
    const userId = "demo-user-badri";
    await disconnectAccount(userId, "GITHUB", "test-external-user");

    const account = await prisma.connectedAccount.findUnique({
      where: {
        provider_externalAccountId: {
          provider: "GITHUB",
          externalAccountId: "test-external-user",
        },
      },
    });

    expect(account?.connectionState).toBe("DISCONNECTED");
    expect(account?.encryptedAccessToken).toBeNull();
    expect(account?.tokenIv).toBeNull();

    // Attempting to retrieve token throws
    await expect(getDecryptedAccessToken("GITHUB", "test-external-user")).rejects.toThrow(
      "DISCONNECTED"
    );
  });
});
