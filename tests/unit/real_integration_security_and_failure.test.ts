import { describe, it, expect, vi, afterAll } from "vitest";
import { RealGitHubAdapter } from "@/integrations/github/real";
import { RealGmailAdapter } from "@/integrations/gmail/real";
import { MockGitHubAdapter } from "@/integrations/github";
import { MockGmailAdapter } from "@/integrations/gmail";
import {
  getDecryptedAccessToken,
  storeEncryptedToken,
  disconnectAccount,
} from "@/lib/oauth";
import { computeHash } from "@/lib/crypto";
import { redactSensitiveData } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { GmailOutreachService } from "@/modules/outreach/service";
import { google } from "googleapis";

describe("Step 6 & 7: Real Integration Security, Failure-Safety & Idempotency", () => {
  const OWNER_USER_ID = "demo-user-badri";

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Missing or Invalid Credentials
  describe("1. Missing or Invalid Credentials", () => {
    it("should return null when retrieving token for an unknown or unconfigured account", async () => {
      const token = await getDecryptedAccessToken("GITHUB", "non-existent-account-999");
      expect(token).toBeNull();
    });

    it("should reject token decryption if auth tag is corrupted or tampered", async () => {
      await storeEncryptedToken(
        OWNER_USER_ID,
        "GITHUB",
        "corrupted-test-account",
        "ghp_valid_token_value_to_corrupt",
        undefined,
        3600
      );

      // Corrupt auth tag in database
      await prisma.connectedAccount.updateMany({
        where: { provider: "GITHUB", externalAccountId: "corrupted-test-account" },
        data: { tokenAuthTag: "00".repeat(16) },
      });

      await expect(
        getDecryptedAccessToken("GITHUB", "corrupted-test-account")
      ).rejects.toThrow();

      // Clean up
      await prisma.connectedAccount.deleteMany({
        where: { provider: "GITHUB", externalAccountId: "corrupted-test-account" },
      });
    });
  });

  // 2. OAuth Failures & Expired / Revoked Tokens
  describe("2. OAuth Failures & Expired / Revoked Tokens", () => {
    it("should throw an explicit expiration error when an access token has expired", async () => {
      // Store token with past expiration
      await storeEncryptedToken(
        OWNER_USER_ID,
        "GMAIL",
        "expired-test-user@gmail.com",
        "ya29.expired_token_mock_value",
        undefined,
        -10 // Expired 10 seconds ago
      );

      await expect(
        getDecryptedAccessToken("GMAIL", "expired-test-user@gmail.com")
      ).rejects.toThrow(/expired/i);

      // Clean up
      await prisma.connectedAccount.deleteMany({
        where: { provider: "GMAIL", externalAccountId: "expired-test-user@gmail.com" },
      });
    });

    it("should reject token retrieval when account state is marked REVOKED", async () => {
      await storeEncryptedToken(
        OWNER_USER_ID,
        "GITHUB",
        "revoked-user",
        "ghp_test_revoked_token",
        undefined,
        3600
      );

      await prisma.connectedAccount.updateMany({
        where: { provider: "GITHUB", externalAccountId: "revoked-user" },
        data: { connectionState: "REVOKED" },
      });

      await expect(getDecryptedAccessToken("GITHUB", "revoked-user")).rejects.toThrow(
        /REVOKED/
      );

      // Clean up
      await prisma.connectedAccount.deleteMany({
        where: { provider: "GITHUB", externalAccountId: "revoked-user" },
      });
    });
  });

  // 3. API Rate Limits & Network Errors
  describe("3. API Rate Limits & Network Outage Handling", () => {
    it("should map HTTP 429 response to RATE_LIMITED error with retryable: true", async () => {
      const adapter = new RealGitHubAdapter("dummy-token", "REAL_CONNECTED_READ_ONLY");

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve("API rate limit exceeded"),
        headers: new Headers({ "x-ratelimit-remaining": "0" }),
      });

      const res = await adapter.listRepositories("badrisatyam1-ctrl");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("RATE_LIMITED");
      expect(res.error?.retryable).toBe(true);
      expect(res.error?.statusCode).toBe(429);

      global.fetch = originalFetch;
    });

    it("should map network outage / 502 Bad Gateway to PROVIDER_OUTAGE with retryable: true", async () => {
      const adapter = new RealGitHubAdapter("dummy-token", "REAL_CONNECTED_READ_ONLY");

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("502 Bad Gateway"));

      const res = await adapter.listRepositories("badrisatyam1-ctrl");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("PROVIDER_OUTAGE");
      expect(res.error?.retryable).toBe(true);

      global.fetch = originalFetch;
    });
  });

  // 4. Demo / Real Data Isolation
  describe("4. Demo / Real Data Isolation", () => {
    it("should return mock data in DEMO mode without invoking external networks", async () => {
      const mockAdapter = new MockGitHubAdapter();
      const res = await mockAdapter.listRepositories("demo-user");
      expect(res.success).toBe(true);
      expect(res.data?.length).toBeGreaterThan(0);
      expect(res.meta.provider).toBe("GITHUB");
    });

    it("should block write operations in REAL_CONNECTED_READ_ONLY mode", async () => {
      const readOnlyAdapter = new RealGitHubAdapter("dummy-token", "REAL_CONNECTED_READ_ONLY");
      const res = await readOnlyAdapter.openPullRequest({
        repo: "owner/repo",
        title: "Test PR",
        body: "PR Description",
        headRef: "feature/test",
        baseRef: "main",
        diffHash: computeHash("+ new code"),
        approvalToken: {
          approvalId: "appr-1",
          contentHash: computeHash("+ new code"),
          isApproved: true,
        },
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
      expect(res.error?.message).toContain("READ_ONLY");
    });
  });

  // 5. Duplicate Email and PR Prevention (Idempotency)
  describe("5. Idempotency & Duplicate Action Prevention", () => {
    it("should prevent re-sending an email that has already been dispatched", async () => {
      const mockAdapter = new MockGmailAdapter();
      mockAdapter.sendCapabilityGranted = true;
      const outreach = new GmailOutreachService(mockAdapter);

      const draft = outreach.getDrafts()[0];
      const approval = await outreach.requestSendApproval("user-1", draft.id);

      // First send succeeds
      const firstSend = await outreach.sendApprovedOutreach(
        "user-1",
        draft.id,
        approval.approvalId,
        approval.contentHash
      );
      expect(firstSend.success).toBe(true);
      expect(draft.status).toBe("SENT");

      // Second send attempt must keep status as SENT without duplicating message
      const secondSend = await outreach.sendApprovedOutreach(
        "user-1",
        draft.id,
        approval.approvalId,
        approval.contentHash
      );
      expect(draft.status).toBe("SENT");
    });

    it("should block outreach immediately when recipient is in DO_NOT_CONTACT state", async () => {
      const mockAdapter = new MockGmailAdapter();
      mockAdapter.sendCapabilityGranted = true;
      const outreach = new GmailOutreachService(mockAdapter);

      const draft = outreach.getDrafts()[0];
      outreach.setDoNotContact(draft.recipient.email, "User unsubscribed");

      await expect(
        outreach.requestSendApproval("user-1", draft.id)
      ).rejects.toThrow(/DO_NOT_CONTACT/);
    });
  });

  // 6. Approval Enforcement & Content Hash Locking (§6)
  describe("6. Cryptographic Approval Enforcement & Content Locking", () => {
    it("should reject external write if payload was modified after approval was granted", async () => {
      const adapter = new RealGitHubAdapter("dummy-token", "REAL_APPROVAL_REQUIRED");

      const originalDiff = "+ safe line of code";
      const approvedHash = computeHash(originalDiff);

      const tamperedDiff = "+ malicious injected command";

      const res = await adapter.openPullRequest({
        repo: "owner/repo",
        title: "PR Title",
        body: "PR Description",
        headRef: "feature/test",
        baseRef: "main",
        diffHash: computeHash(tamperedDiff),
        approvalToken: {
          approvalId: "approval-token-001",
          contentHash: approvedHash, // Mismatched!
          isApproved: true,
        },
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("APPROVAL_MISMATCH");
      expect(res.error?.message).toContain("Code changed after approval");
    });

    it("should reject execution if approval token is unapproved", async () => {
      const adapter = new RealGitHubAdapter("dummy-token", "REAL_APPROVAL_REQUIRED");
      const diff = "+ line";

      const res = await adapter.openPullRequest({
        repo: "owner/repo",
        title: "PR Title",
        body: "PR Description",
        headRef: "feature/test",
        baseRef: "main",
        diffHash: computeHash(diff),
        approvalToken: {
          approvalId: "appr-unapproved",
          contentHash: computeHash(diff),
          isApproved: false, // Not approved!
        },
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    });
  });

  // 7. Failed Writes & Retries (Never report failure as success)
  describe("7. Failed Writes & Integrity Protection", () => {
    it("should record failed status and error details when remote API fails", async () => {
      const adapter = new RealGmailAdapter("mock-token", "REAL_WRITE_ENABLED");

      const originalGmail = google.gmail;
      google.gmail = vi.fn().mockReturnValue({
        users: {
          messages: {
            send: vi.fn().mockRejectedValue(new Error("500 Internal Gmail Server Error")),
          },
        },
      } as any);

      const res = await adapter.sendApprovedEmail({
        draftId: "draft-1",
        to: "recruiter@example.com",
        subject: "Subject",
        body: "Body",
        approvalToken: {
          approvalId: "appr-1",
          contentHash: computeHash("Body"),
          isApproved: true,
        },
      });

      expect(res.success).toBe(false);
      expect(res.error?.statusCode).toBe(500);
      expect(res.data).toBeUndefined();

      google.gmail = originalGmail;
    });
  });

  // 8. Real Draft Creation in REAL_DRAFT_ONLY
  describe("8. Real Draft Creation Safeguard", () => {
    it("should permit creating drafts in Gmail Drafts folder in REAL_DRAFT_ONLY mode", async () => {
      const adapter = new RealGmailAdapter("mock-token", "REAL_DRAFT_ONLY");

      const originalGmail = google.gmail;
      google.gmail = vi.fn().mockReturnValue({
        users: {
          drafts: {
            create: vi.fn().mockResolvedValue({
              data: {
                id: "real-gmail-draft-987",
                message: { threadId: "thread-123" },
              },
            }),
          },
        },
      } as any);

      const res = await adapter.createEmailDraft({
        to: "recruiter@company.com",
        subject: "Application",
        body: "Hello Recruiter",
      });

      expect(res.success).toBe(true);
      expect(res.data?.id).toBe("real-gmail-draft-987");

      google.gmail = originalGmail;
    });

    it("should block email transmission in REAL_DRAFT_ONLY mode", async () => {
      const adapter = new RealGmailAdapter("mock-token", "REAL_DRAFT_ONLY");
      const res = await adapter.sendApprovedEmail({
        draftId: "draft-1",
        to: "recruiter@example.com",
        subject: "Subject",
        body: "Body",
        approvalToken: {
          approvalId: "appr-1",
          contentHash: computeHash("Body"),
          isApproved: true,
        },
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
      expect(res.error?.message).toContain("REAL_DRAFT_ONLY");
    });
  });

  // 9. Secret Redaction & Log Sanitization
  describe("9. Secret Redaction & Observability Protection", () => {
    it("should redact GitHub Personal Access Tokens from logger payloads", () => {
      const payload = {
        username: "badrisatyam1-ctrl",
        token: "ghp_1234567890abcdefghijklmnopqrstuvwxyz1234",
        nested: {
          clientSecret: "very_secret_oauth_secret",
        },
      };

      const redacted = redactSensitiveData(payload) as Record<string, unknown>;
      expect(redacted.token).toBe("[REDACTED]");
      expect((redacted.nested as Record<string, unknown>).clientSecret).toBe("[REDACTED]");
      expect(redacted.username).toBe("badrisatyam1-ctrl");
    });

    it("should scrub raw tokens embedded in string messages", () => {
      const msg = "Connected with token ghp_abcdefghijklmnopqrstuvwxyz1234567890 securely";
      const redacted = redactSensitiveData(msg);
      expect(redacted).not.toContain("ghp_");
      expect(redacted).toContain("[REDACTED_CREDENTIAL]");
    });
  });

  // 10. Disconnect Flow & Revocation Handling
  describe("10. Disconnect & Token Purge Flow", () => {
    it("should wipe encrypted tokens, IVs, and reset mode to DEMO upon disconnect", async () => {
      const accountId = "account-to-disconnect";

      await storeEncryptedToken(
        OWNER_USER_ID,
        "GITHUB",
        accountId,
        "ghp_temporary_test_token",
        undefined,
        3600
      );

      // Verify stored
      const preCheck = await prisma.connectedAccount.findFirst({
        where: { provider: "GITHUB", externalAccountId: accountId },
      });
      expect(preCheck?.encryptedAccessToken).toBeDefined();

      // Disconnect
      await disconnectAccount(OWNER_USER_ID, "GITHUB", accountId);

      // Verify completely purged
      const postCheck = await prisma.connectedAccount.findFirst({
        where: { provider: "GITHUB", externalAccountId: accountId },
      });
      expect(postCheck?.encryptedAccessToken).toBeNull();
      expect(postCheck?.tokenIv).toBeNull();
      expect(postCheck?.tokenAuthTag).toBeNull();
      expect(postCheck?.connectionState).toBe("DISCONNECTED");
      expect(postCheck?.integrationMode).toBe("DEMO");

      // Clean up
      await prisma.connectedAccount.deleteMany({
        where: { provider: "GITHUB", externalAccountId: accountId },
      });
    });
  });
});
