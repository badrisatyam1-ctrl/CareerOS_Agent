import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret, computeHash } from "@/lib/crypto";

describe("Crypto Module (AES-256-GCM & SHA-256)", () => {
  it("should encrypt and decrypt a sensitive OAuth token correctly", () => {
    const rawToken = "gho_test1234567890abcdefghijklmnopqrstuvwxyz";
    const encrypted = encryptSecret(rawToken);

    expect(encrypted.encryptedText).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();
    expect(encrypted.encryptedText).not.toBe(rawToken);

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(rawToken);
  });

  it("should fail decryption if authTag is tampered with", () => {
    const rawToken = "secret-token-to-tamper";
    const encrypted = encryptSecret(rawToken);

    const tampered = {
      ...encrypted,
      authTag: "00".repeat(16),
    };

    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("should compute deterministic SHA-256 hash for approval verification", () => {
    const content = "Hello Badri, this is a test message.";
    const hash1 = computeHash(content);
    const hash2 = computeHash(content);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // 64 hex characters
  });
});
