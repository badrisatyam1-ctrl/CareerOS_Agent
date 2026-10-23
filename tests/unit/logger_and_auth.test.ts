import { describe, it, expect } from "vitest";
import { redactSensitiveData } from "@/lib/logger";
import { validateApproval, requireOwnerSession, DEMO_USER } from "@/lib/auth";

describe("Logger & Sensitive Data Redaction", () => {
  it("should redact access tokens, refresh tokens, and secrets", () => {
    const rawPayload = {
      username: "badri",
      accessToken: "ghp_super_secret_oauth_token",
      refreshToken: "refresh_secret_xyz",
      email: "badri@example.com",
      nested: {
        apiSecretKey: "stripe_sec_12345",
        normalKey: "safe_value",
      },
    };

    const redacted = redactSensitiveData(rawPayload) as any;

    expect(redacted.accessToken).toBe("[REDACTED]");
    expect(redacted.refreshToken).toBe("[REDACTED]");
    expect(redacted.nested.apiSecretKey).toBe("[REDACTED]");
    expect(redacted.username).toBe("badri");
    expect(redacted.nested.normalKey).toBe("safe_value");
  });
});

describe("Authorization & Approval Guard", () => {
  it("should return demo session in demo mode", async () => {
    const session = await requireOwnerSession();
    expect(session.id).toBe(DEMO_USER.id);
    expect(session.role).toBe("OWNER");
  });

  it("should validate approval when content hash matches and not expired", () => {
    const hash = "abc123".repeat(10);
    const futureExpiry = new Date(Date.now() + 60000);

    const validation = validateApproval(hash, hash, futureExpiry);
    expect(validation.valid).toBe(true);
  });

  it("should reject approval if expired", () => {
    const hash = "abc123".repeat(10);
    const pastExpiry = new Date(Date.now() - 60000);

    const validation = validateApproval(hash, hash, pastExpiry);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain("expired");
  });

  it("should reject approval if content hash is mismatched", () => {
    const storedHash = "hash1".repeat(10);
    const tamperedHash = "hash2".repeat(10);
    const futureExpiry = new Date(Date.now() + 60000);

    const validation = validateApproval(storedHash, tamperedHash, futureExpiry);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain("Content hash mismatch");
  });
});
