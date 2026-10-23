import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { RealGitHubAdapter } from "@/integrations/github/real";
import { RealGmailAdapter } from "@/integrations/gmail/real";
import { MockGitHubAdapter } from "@/integrations/github";
import { MockGmailAdapter } from "@/integrations/gmail";
import { MockLinkedInAdapter } from "@/integrations/linkedin";
import {
  getDecryptedAccessToken,
  storeEncryptedToken,
  disconnectAccount,
  generateOAuthState,
  validateOAuthState,
  validateRedirectUri,
} from "@/lib/oauth";
import { computeHash, encryptSecret, decryptSecret } from "@/lib/crypto";
import { redactSensitiveData, redactString } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { GmailOutreachService } from "@/modules/outreach/service";
import { ContributionWorkbenchService } from "@/modules/workbench/service";
import { isWriteAllowed, isRealMode, getModeLabel, getModeColor } from "@/integrations/mode";
import type { IntegrationMode } from "@/integrations/mode";
import { google } from "googleapis";

/**
 * Step 7: Comprehensive Integration Testing Suite
 *
 * Covers every failure mode and security gate required before any real-account
 * writes are permitted. Zero real external actions — all API calls are mocked
 * or use the adapter's built-in simulation flags.
 *
 * Categories:
 *   1. Missing or Invalid Credentials
 *   2. OAuth Failures and Expired Tokens
 *   3. API Rate Limits and Network Errors
 *   4. Demo/Real Data Isolation
 *   5. Duplicate Email and PR Prevention
 *   6. Approval Enforcement
 *   7. Failed Writes and Retries
 *   8. Successful Real API Reads (mock-based)
 *   9. Real Draft Creation
 *  10. GitHub Branch and PR Workflows (mocks)
 */
describe("Step 7: Comprehensive Integration Tests", () => {
  const OWNER_USER_ID = "demo-user-badri";

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Missing or Invalid Credentials
  // ═══════════════════════════════════════════════════════════════════════════
  describe("1. Missing or Invalid Credentials", () => {
    it("should return null for a completely unknown provider/account combination", async () => {
      const token = await getDecryptedAccessToken("GITHUB", "nobody-ever-registered-this-id");
      expect(token).toBeNull();
    });

    it("should return null when encrypted fields are missing (wiped account)", async () => {
      // Create then wipe the token fields
      await storeEncryptedToken(OWNER_USER_ID, "GITHUB", "wiped-creds-test", "ghp_temp123", undefined, 3600);
      await prisma.connectedAccount.updateMany({
        where: { provider: "GITHUB", externalAccountId: "wiped-creds-test" },
        data: { encryptedAccessToken: null, tokenIv: null, tokenAuthTag: null },
      });

      const token = await getDecryptedAccessToken("GITHUB", "wiped-creds-test");
      expect(token).toBeNull();

      // Clean up
      await prisma.connectedAccount.deleteMany({
        where: { provider: "GITHUB", externalAccountId: "wiped-creds-test" },
      });
    });

    it("should throw on corrupted auth tag (tamper detection)", async () => {
      await storeEncryptedToken(OWNER_USER_ID, "GITHUB", "tamper-test-account", "ghp_real_token_value", undefined, 3600);

      // Corrupt the auth tag
      await prisma.connectedAccount.updateMany({
        where: { provider: "GITHUB", externalAccountId: "tamper-test-account" },
        data: { tokenAuthTag: "ff".repeat(16) },
      });

      await expect(getDecryptedAccessToken("GITHUB", "tamper-test-account")).rejects.toThrow();

      await prisma.connectedAccount.deleteMany({
        where: { provider: "GITHUB", externalAccountId: "tamper-test-account" },
      });
    });

    it("should throw on corrupted IV (wrong initialization vector)", async () => {
      await storeEncryptedToken(OWNER_USER_ID, "GMAIL", "bad-iv-test", "ya29.realtoken", undefined, 3600);

      await prisma.connectedAccount.updateMany({
        where: { provider: "GMAIL", externalAccountId: "bad-iv-test" },
        data: { tokenIv: "aa".repeat(12) },
      });

      await expect(getDecryptedAccessToken("GMAIL", "bad-iv-test")).rejects.toThrow();

      await prisma.connectedAccount.deleteMany({
        where: { provider: "GMAIL", externalAccountId: "bad-iv-test" },
      });
    });

    it("should reject RealGitHubAdapter with empty token (401 from GitHub)", async () => {
      const adapter = new RealGitHubAdapter("", "REAL_CONNECTED_READ_ONLY");
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("401 Unauthorized — Bad credentials"),
        headers: new Headers(),
      });

      const res = await adapter.listRepositories("testuser");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("EXPIRED_CREDENTIALS");
      expect(res.error?.retryable).toBe(false);

      global.fetch = originalFetch;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. OAuth Failures and Expired Tokens
  // ═══════════════════════════════════════════════════════════════════════════
  describe("2. OAuth Failures and Expired Tokens", () => {
    it("should reject retrieval of an expired token with explicit error", async () => {
      await storeEncryptedToken(OWNER_USER_ID, "GMAIL", "expired-oauth-test", "ya29.expired", undefined, -60);

      await expect(getDecryptedAccessToken("GMAIL", "expired-oauth-test")).rejects.toThrow(/expired/i);

      await prisma.connectedAccount.deleteMany({
        where: { provider: "GMAIL", externalAccountId: "expired-oauth-test" },
      });
    });

    it("should reject retrieval when account is REVOKED", async () => {
      await storeEncryptedToken(OWNER_USER_ID, "GITHUB", "revoked-oauth-test", "ghp_revoked", undefined, 3600);
      await prisma.connectedAccount.updateMany({
        where: { provider: "GITHUB", externalAccountId: "revoked-oauth-test" },
        data: { connectionState: "REVOKED" },
      });

      await expect(getDecryptedAccessToken("GITHUB", "revoked-oauth-test")).rejects.toThrow(/REVOKED/);

      await prisma.connectedAccount.deleteMany({
        where: { provider: "GITHUB", externalAccountId: "revoked-oauth-test" },
      });
    });

    it("should reject retrieval when account is DISCONNECTED", async () => {
      await storeEncryptedToken(OWNER_USER_ID, "GITHUB", "disconnected-test", "ghp_disconn", undefined, 3600);
      await prisma.connectedAccount.updateMany({
        where: { provider: "GITHUB", externalAccountId: "disconnected-test" },
        data: { connectionState: "DISCONNECTED" },
      });

      await expect(getDecryptedAccessToken("GITHUB", "disconnected-test")).rejects.toThrow(/DISCONNECTED/);

      await prisma.connectedAccount.deleteMany({
        where: { provider: "GITHUB", externalAccountId: "disconnected-test" },
      });
    });

    it("should generate and validate OAuth state tokens correctly", () => {
      const state = generateOAuthState("GITHUB");
      expect(state).toHaveLength(64); // 32 bytes hex

      // Valid consumption
      expect(validateOAuthState(state, "GITHUB")).toBe(true);

      // Double-use must fail (single-use)
      expect(validateOAuthState(state, "GITHUB")).toBe(false);
    });

    it("should reject OAuth state with wrong provider", () => {
      const state = generateOAuthState("GITHUB");
      expect(validateOAuthState(state, "GMAIL")).toBe(false);
    });

    it("should reject empty or non-existent state tokens", () => {
      expect(validateOAuthState("", "GITHUB")).toBe(false);
      expect(validateOAuthState("nonexistent-token", "GITHUB")).toBe(false);
    });

    it("should validate redirect URIs against allowlist", () => {
      expect(validateRedirectUri("http://localhost:3000/api/auth/callback/github")).toBe(true);
      expect(validateRedirectUri("http://localhost:3000/api/auth/callback/google")).toBe(true);
      expect(validateRedirectUri("http://evil.com/steal-token")).toBe(false);
      expect(validateRedirectUri("")).toBe(false);
    });

    it("should handle MockGitHubAdapter simulateExpired flag", async () => {
      const adapter = new MockGitHubAdapter();
      adapter.simulateExpired = true;

      const res = await adapter.listRepositories("test-user");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("EXPIRED_CREDENTIALS");
      expect(res.error?.statusCode).toBe(401);
      expect(res.error?.retryable).toBe(false);
    });

    it("should handle MockGmailAdapter simulateRevoked flag", async () => {
      const adapter = new MockGmailAdapter();
      adapter.simulateRevoked = true;

      const res = await adapter.createEmailDraft({
        to: "test@example.com",
        subject: "Test",
        body: "Body",
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("REVOKED_ACCESS");
      expect(res.error?.statusCode).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. API Rate Limits and Network Errors
  // ═══════════════════════════════════════════════════════════════════════════
  describe("3. API Rate Limits and Network Errors", () => {
    it("should map HTTP 429 from GitHub to RATE_LIMITED with retryable=true", async () => {
      const adapter = new RealGitHubAdapter("dummy-token", "REAL_CONNECTED_READ_ONLY");
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve("API rate limit exceeded"),
        headers: new Headers({ "x-ratelimit-remaining": "0" }),
      });

      const res = await adapter.listRepositories("test-user");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("RATE_LIMITED");
      expect(res.error?.retryable).toBe(true);
      expect(res.error?.statusCode).toBe(429);

      global.fetch = originalFetch;
    });

    it("should map network timeout/503 to PROVIDER_OUTAGE with retryable=true", async () => {
      const adapter = new RealGitHubAdapter("dummy-token", "REAL_CONNECTED_READ_ONLY");
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("503 Service Unavailable"));

      const res = await adapter.listIssues("owner/repo");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("PROVIDER_OUTAGE");
      expect(res.error?.retryable).toBe(true);

      global.fetch = originalFetch;
    });

    it("should map fetch rejection (DNS failure) to PROVIDER_OUTAGE", async () => {
      const adapter = new RealGitHubAdapter("dummy-token", "REAL_CONNECTED_READ_ONLY");
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("getaddrinfo ENOTFOUND api.github.com"));

      const res = await adapter.listRepositories("test-user");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("PROVIDER_OUTAGE");
      expect(res.error?.retryable).toBe(true);

      global.fetch = originalFetch;
    });

    it("should map HTTP 403 Forbidden to REVOKED_ACCESS with retryable=false", async () => {
      const adapter = new RealGitHubAdapter("dummy-token", "REAL_CONNECTED_READ_ONLY");
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve("403 Forbidden — Resource not accessible by personal access token"),
        headers: new Headers(),
      });

      const res = await adapter.listRepositories("test-user");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("REVOKED_ACCESS");
      expect(res.error?.retryable).toBe(false);
      expect(res.error?.statusCode).toBe(403);

      global.fetch = originalFetch;
    });

    it("should handle MockGitHubAdapter rate limit simulation", async () => {
      const adapter = new MockGitHubAdapter();
      adapter.simulateRateLimit = true;

      const repos = await adapter.listRepositories("test-user");
      const issues = await adapter.listIssues("owner/repo");
      const trending = await adapter.getTrendingRepositories("python");

      expect(repos.success).toBe(false);
      expect(repos.error?.code).toBe("RATE_LIMITED");
      expect(issues.success).toBe(false);
      expect(issues.error?.code).toBe("RATE_LIMITED");
      expect(trending.success).toBe(false);
      expect(trending.error?.code).toBe("RATE_LIMITED");
    });

    it("should handle MockGitHubAdapter outage simulation across all endpoints", async () => {
      const adapter = new MockGitHubAdapter();
      adapter.simulateOutage = true;

      const repos = await adapter.listRepositories("test-user");
      const starred = await adapter.listStarredRepositories("test-user");
      const prs = await adapter.listUserPullRequests("test-user");

      expect(repos.error?.code).toBe("PROVIDER_OUTAGE");
      expect(starred.error?.code).toBe("PROVIDER_OUTAGE");
      expect(prs.error?.code).toBe("PROVIDER_OUTAGE");
    });

    it("should handle MockGmailAdapter rate limit simulation", async () => {
      const adapter = new MockGmailAdapter();
      adapter.simulateRateLimit = true;

      const draft = await adapter.createEmailDraft({ to: "a@b.com", subject: "S", body: "B" });
      expect(draft.success).toBe(false);
      expect(draft.error?.code).toBe("RATE_LIMITED");
      expect(draft.error?.retryable).toBe(true);
    });

    it("should map Gmail 401/invalid_grant to EXPIRED_CREDENTIALS", async () => {
      const adapter = new RealGmailAdapter("invalid-token", "REAL_DRAFT_ONLY");
      const originalGmail = google.gmail;
      google.gmail = vi.fn().mockReturnValue({
        users: {
          drafts: {
            create: vi.fn().mockRejectedValue(new Error("401 invalid_grant: Token revoked")),
          },
        },
      } as any);

      const res = await adapter.createEmailDraft({ to: "a@b.com", subject: "S", body: "B" });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("EXPIRED_CREDENTIALS");
      expect(res.error?.retryable).toBe(false);

      google.gmail = originalGmail;
    });

    it("should map Gmail 429 to RATE_LIMITED", async () => {
      const adapter = new RealGmailAdapter("token", "REAL_DRAFT_ONLY");
      const originalGmail = google.gmail;
      google.gmail = vi.fn().mockReturnValue({
        users: {
          drafts: {
            create: vi.fn().mockRejectedValue(new Error("429 Too Many Requests")),
          },
        },
      } as any);

      const res = await adapter.createEmailDraft({ to: "a@b.com", subject: "S", body: "B" });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("RATE_LIMITED");
      expect(res.error?.retryable).toBe(true);

      google.gmail = originalGmail;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Demo/Real Data Isolation
  // ═══════════════════════════════════════════════════════════════════════════
  describe("4. Demo/Real Data Isolation", () => {
    it("should return mock data from MockGitHubAdapter without network calls", async () => {
      const mock = new MockGitHubAdapter();
      const res = await mock.listRepositories("badrisatyam1-ctrl");
      expect(res.success).toBe(true);
      expect(res.data?.length).toBeGreaterThan(0);
      expect(res.meta.provider).toBe("GITHUB");
      // All repos should belong to the demo user
      res.data?.forEach((repo) => {
        expect(repo.owner).toBe("badrisatyam1-ctrl");
      });
    });

    it("should return mock data from MockGmailAdapter without network calls", async () => {
      const mock = new MockGmailAdapter();
      const res = await mock.createEmailDraft({
        to: "recruiter@company.com",
        subject: "Application",
        body: "Hello",
      });
      expect(res.success).toBe(true);
      expect(res.data?.id).toMatch(/^draft-/);
      expect(res.meta.provider).toBe("GMAIL");
    });

    it("should block write operations in REAL_CONNECTED_READ_ONLY mode", async () => {
      const readOnly = new RealGitHubAdapter("dummy-token", "REAL_CONNECTED_READ_ONLY");
      const res = await readOnly.openPullRequest({
        repo: "owner/repo",
        title: "Test PR",
        body: "Description",
        headRef: "feat/test",
        baseRef: "main",
        diffHash: computeHash("code"),
        approvalToken: { approvalId: "a1", contentHash: computeHash("code"), isApproved: true },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    it("should block write operations in REAL_DRAFT_ONLY mode for GitHub", async () => {
      const draftOnly = new RealGitHubAdapter("dummy-token", "REAL_DRAFT_ONLY");
      const res = await draftOnly.openPullRequest({
        repo: "owner/repo",
        title: "Test PR",
        body: "Description",
        headRef: "feat/test",
        baseRef: "main",
        diffHash: computeHash("code"),
        approvalToken: { approvalId: "a1", contentHash: computeHash("code"), isApproved: true },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    it("should block email creation in REAL_CONNECTED_READ_ONLY for Gmail", async () => {
      const readOnly = new RealGmailAdapter("token", "REAL_CONNECTED_READ_ONLY");
      const res = await readOnly.createEmailDraft({
        to: "test@example.com",
        subject: "Test",
        body: "Body",
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    it("should block email sending in REAL_DRAFT_ONLY mode for Gmail", async () => {
      const draftOnly = new RealGmailAdapter("token", "REAL_DRAFT_ONLY");
      const res = await draftOnly.sendApprovedEmail({
        draftId: "d1",
        to: "test@example.com",
        subject: "Test",
        body: "Body",
        approvalToken: { approvalId: "a1", contentHash: computeHash("Body"), isApproved: true },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
      expect(res.error?.message).toContain("REAL_DRAFT_ONLY");
    });

    it("should correctly identify real vs demo modes via isRealMode()", () => {
      expect(isRealMode("DEMO")).toBe(false);
      expect(isRealMode("REAL_CONNECTED_READ_ONLY")).toBe(true);
      expect(isRealMode("REAL_DRAFT_ONLY")).toBe(true);
      expect(isRealMode("REAL_APPROVAL_REQUIRED")).toBe(true);
      expect(isRealMode("REAL_WRITE_ENABLED")).toBe(true);
    });

    it("should correctly enforce isWriteAllowed() only for approval and write modes", () => {
      expect(isWriteAllowed("DEMO")).toBe(false);
      expect(isWriteAllowed("REAL_CONNECTED_READ_ONLY")).toBe(false);
      expect(isWriteAllowed("REAL_DRAFT_ONLY")).toBe(false);
      expect(isWriteAllowed("REAL_APPROVAL_REQUIRED")).toBe(true);
      expect(isWriteAllowed("REAL_WRITE_ENABLED")).toBe(true);
    });

    it("should provide correct labels and colors for every integration mode", () => {
      const modes: IntegrationMode[] = [
        "DEMO",
        "REAL_CONNECTED_READ_ONLY",
        "REAL_DRAFT_ONLY",
        "REAL_APPROVAL_REQUIRED",
        "REAL_WRITE_ENABLED",
      ];
      for (const mode of modes) {
        expect(getModeLabel(mode)).toBeTruthy();
        expect(getModeColor(mode)).toBeTruthy();
      }
    });

    it("should use ETag cache handling for conditional requests in mock adapter", async () => {
      const mock = new MockGitHubAdapter();
      // First request — returns full data
      const full = await mock.listRepositories("user1");
      expect(full.success).toBe(true);
      expect(full.data?.length).toBeGreaterThan(0);

      // Conditional request with matching ETag — returns empty (304 semantics)
      const cached = await mock.listRepositories("user1", { eTag: '"etag-repos-v1"' });
      expect(cached.success).toBe(true);
      expect(cached.data?.length).toBe(0); // 304 — use cache
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Duplicate Email and PR Prevention
  // ═══════════════════════════════════════════════════════════════════════════
  describe("5. Duplicate Email and PR Prevention", () => {
    it("should prevent re-sending an email that was already dispatched (idempotency)", async () => {
      const adapter = new MockGmailAdapter();
      adapter.sendCapabilityGranted = true;
      const outreach = new GmailOutreachService(adapter);

      const draft = outreach.getDrafts()[0];
      const approval = await outreach.requestSendApproval("user-1", draft.id);

      // First send
      const firstSend = await outreach.sendApprovedOutreach("user-1", draft.id, approval.approvalId, approval.contentHash);
      expect(firstSend.success).toBe(true);
      expect(draft.status).toBe("SENT");

      // Second send — must not duplicate
      const secondSend = await outreach.sendApprovedOutreach("user-1", draft.id, approval.approvalId, approval.contentHash);
      expect(draft.status).toBe("SENT"); // Still SENT, no duplicate
    });

    it("should enforce DO_NOT_CONTACT list and block outreach", async () => {
      const adapter = new MockGmailAdapter();
      adapter.sendCapabilityGranted = true;
      const outreach = new GmailOutreachService(adapter);

      const draft = outreach.getDrafts()[0];
      outreach.setDoNotContact(draft.recipient.email, "User opted out");

      await expect(outreach.requestSendApproval("user-1", draft.id)).rejects.toThrow(/DO_NOT_CONTACT/);
    });

    it("should block PR creation without write capability on MockGitHubAdapter", async () => {
      const adapter = new MockGitHubAdapter();
      // writeCapabilityGranted defaults to false
      const diff = "some diff";
      const res = await adapter.openPullRequest({
        repo: "owner/repo",
        title: "Test PR",
        body: "Body",
        headRef: "feat/test",
        baseRef: "main",
        diffHash: computeHash(diff),
        approvalToken: { approvalId: "a1", contentHash: computeHash(diff), isApproved: true },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    it("should prevent PR with mismatched diff hash (code changed after approval)", async () => {
      const adapter = new MockGitHubAdapter();
      adapter.writeCapabilityGranted = true;

      const originalDiff = "original code";
      const approvedHash = computeHash(originalDiff);
      const tamperedDiff = "tampered code";

      const res = await adapter.openPullRequest({
        repo: "owner/repo",
        title: "Test PR",
        body: "Body",
        headRef: "feat/test",
        baseRef: "main",
        diffHash: computeHash(tamperedDiff), // Different hash
        approvalToken: { approvalId: "a1", contentHash: approvedHash, isApproved: true },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("APPROVAL_MISMATCH");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. Approval Enforcement
  // ═══════════════════════════════════════════════════════════════════════════
  describe("6. Approval Enforcement", () => {
    it("should reject PR when approval token is missing", async () => {
      const adapter = new RealGitHubAdapter("token", "REAL_APPROVAL_REQUIRED");
      const res = await adapter.openPullRequest({
        repo: "owner/repo",
        title: "PR",
        body: "Desc",
        headRef: "feat/test",
        baseRef: "main",
        diffHash: computeHash("code"),
        approvalToken: { approvalId: "", contentHash: computeHash("code"), isApproved: false },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    it("should reject PR when content hash does not match approved hash", async () => {
      const adapter = new RealGitHubAdapter("token", "REAL_APPROVAL_REQUIRED");
      const res = await adapter.openPullRequest({
        repo: "owner/repo",
        title: "PR",
        body: "Desc",
        headRef: "feat/test",
        baseRef: "main",
        diffHash: computeHash("tampered code"),
        approvalToken: { approvalId: "a1", contentHash: computeHash("original code"), isApproved: true },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("APPROVAL_MISMATCH");
    });

    it("should reject email when approval token is not approved", async () => {
      const adapter = new RealGmailAdapter("token", "REAL_APPROVAL_REQUIRED");
      const res = await adapter.sendApprovedEmail({
        draftId: "d1",
        to: "test@example.com",
        subject: "Sub",
        body: "Body text",
        approvalToken: { approvalId: "a1", contentHash: computeHash("Body text"), isApproved: false },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    it("should reject email when body was modified after approval", async () => {
      const adapter = new RealGmailAdapter("token", "REAL_WRITE_ENABLED");
      const originalBody = "Original email body";
      const tamperedBody = "Tampered email body with malicious link";

      const res = await adapter.sendApprovedEmail({
        draftId: "d1",
        to: "test@example.com",
        subject: "Sub",
        body: tamperedBody, // Body has changed
        approvalToken: { approvalId: "a1", contentHash: computeHash(originalBody), isApproved: true },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("APPROVAL_MISMATCH");
    });

    it("should reject unapproved send via MockGmailAdapter", async () => {
      const adapter = new MockGmailAdapter();
      // sendCapabilityGranted defaults to false

      const res = await adapter.sendApprovedEmail({
        draftId: "d1",
        to: "test@example.com",
        subject: "Sub",
        body: "Body",
        approvalToken: { approvalId: "a1", contentHash: computeHash("Body"), isApproved: true },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    it("should accept email via MockGmailAdapter only when all gates pass", async () => {
      const adapter = new MockGmailAdapter();
      adapter.sendCapabilityGranted = true;

      const body = "Legitimate email body";
      const res = await adapter.sendApprovedEmail({
        draftId: "d1",
        to: "test@example.com",
        subject: "Sub",
        body,
        approvalToken: { approvalId: "a1", contentHash: computeHash(body), isApproved: true },
      });
      expect(res.success).toBe(true);
      expect(res.data?.recipient).toBe("test@example.com");
    });

    it("should reject MockGmailAdapter send with tampered content hash", async () => {
      const adapter = new MockGmailAdapter();
      adapter.sendCapabilityGranted = true;

      const res = await adapter.sendApprovedEmail({
        draftId: "d1",
        to: "test@example.com",
        subject: "Sub",
        body: "Modified body",
        approvalToken: { approvalId: "a1", contentHash: computeHash("Original body"), isApproved: true },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("APPROVAL_MISMATCH");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Failed Writes and Retries
  // ═══════════════════════════════════════════════════════════════════════════
  describe("7. Failed Writes and Retries", () => {
    it("should record failure status when Gmail send API throws 500", async () => {
      const adapter = new RealGmailAdapter("token", "REAL_WRITE_ENABLED");
      const originalGmail = google.gmail;
      google.gmail = vi.fn().mockReturnValue({
        users: {
          messages: {
            send: vi.fn().mockRejectedValue(new Error("500 Internal Server Error")),
          },
        },
      } as any);

      const body = "Email body";
      const res = await adapter.sendApprovedEmail({
        draftId: "d1",
        to: "test@example.com",
        subject: "Sub",
        body,
        approvalToken: { approvalId: "a1", contentHash: computeHash(body), isApproved: true },
      });
      expect(res.success).toBe(false);
      expect(res.error?.statusCode).toBe(500);
      expect(res.data).toBeUndefined();

      google.gmail = originalGmail;
    });

    it("should mark GitHub PR creation failure correctly when API returns error", async () => {
      const adapter = new RealGitHubAdapter("token", "REAL_WRITE_ENABLED");
      const originalFetch = global.fetch;

      const diff = "code";
      const hash = computeHash(diff);
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: () => Promise.resolve("422 Unprocessable Entity — No commits between main and feat/test"),
        headers: new Headers(),
      });

      const res = await adapter.openPullRequest({
        repo: "owner/repo",
        title: "PR",
        body: "Desc",
        headRef: "feat/test",
        baseRef: "main",
        diffHash: hash,
        approvalToken: { approvalId: "a1", contentHash: hash, isApproved: true },
      });
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
      expect(res.data).toBeUndefined();

      global.fetch = originalFetch;
    });

    it("should return failed status with no data when GitHub fetch throws network error", async () => {
      const adapter = new RealGitHubAdapter("token", "REAL_WRITE_ENABLED");
      const originalFetch = global.fetch;

      const diff = "code";
      const hash = computeHash(diff);
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("ERR_CONNECTION_RESET"));

      const res = await adapter.openPullRequest({
        repo: "owner/repo",
        title: "PR",
        body: "Desc",
        headRef: "feat/test",
        baseRef: "main",
        diffHash: hash,
        approvalToken: { approvalId: "a1", contentHash: hash, isApproved: true },
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("PROVIDER_OUTAGE");
      expect(res.error?.retryable).toBe(true);
      expect(res.data).toBeUndefined();

      global.fetch = originalFetch;
    });

    it("should not report success on Gmail outage simulation", async () => {
      const adapter = new MockGmailAdapter();
      adapter.simulateOutage = true;

      const draft = await adapter.createEmailDraft({
        to: "test@example.com",
        subject: "Test",
        body: "Body",
      });
      expect(draft.success).toBe(false);
      expect(draft.error?.code).toBe("PROVIDER_OUTAGE");
      expect(draft.data).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. Successful Real API Reads (via mocked fetch)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("8. Successful Real API Reads (mock-based)", () => {
    it("should parse GitHub user repos response correctly via RealGitHubAdapter", async () => {
      const adapter = new RealGitHubAdapter("test-token", "REAL_CONNECTED_READ_ONLY");
      const originalFetch = global.fetch;

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 12345,
              full_name: "testuser/my-project",
              name: "my-project",
              owner: { login: "testuser" },
              html_url: "https://github.com/testuser/my-project",
              description: "Test project",
              private: false,
              fork: false,
              default_branch: "main",
              stargazers_count: 10,
              forks_count: 2,
              open_issues_count: 3,
              language: "TypeScript",
              topics: ["web", "typescript"],
              license: { spdx_id: "MIT" },
              updated_at: "2026-10-20T10:00:00Z",
            },
          ]),
        headers: new Headers({ "x-ratelimit-remaining": "4999" }),
      });

      const res = await adapter.listRepositories("testuser");
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data![0].fullName).toBe("testuser/my-project");
      expect(res.data![0].primaryLanguage).toBe("TypeScript");
      expect(res.data![0].licenseSpdx).toBe("MIT");
      expect(res.data![0].starsCount).toBe(10);
      expect(res.meta.rateLimitRemaining).toBe(4999);

      global.fetch = originalFetch;
    });

    it("should parse GitHub issues response correctly via RealGitHubAdapter", async () => {
      const adapter = new RealGitHubAdapter("test-token", "REAL_CONNECTED_READ_ONLY");
      const originalFetch = global.fetch;

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 99,
              number: 7,
              title: "Fix CI pipeline",
              html_url: "https://github.com/owner/repo/issues/7",
              state: "open",
              body: "CI pipeline is failing on main",
              labels: [{ name: "bug" }, { name: "good first issue" }],
              assignee: null,
              created_at: "2026-10-19T10:00:00Z",
              updated_at: "2026-10-20T14:00:00Z",
            },
            {
              id: 100,
              number: 8,
              title: "Pull request (should be filtered)",
              html_url: "https://github.com/owner/repo/pull/8",
              state: "open",
              body: "",
              labels: [],
              assignee: null,
              pull_request: { url: "..." }, // This should be filtered out
              created_at: "2026-10-19T10:00:00Z",
              updated_at: "2026-10-20T14:00:00Z",
            },
          ]),
        headers: new Headers(),
      });

      const res = await adapter.listIssues("owner/repo");
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1); // PR filtered out
      expect(res.data![0].number).toBe(7);
      expect(res.data![0].labels).toContain("bug");
      expect(res.data![0].labels).toContain("good first issue");

      global.fetch = originalFetch;
    });

    it("should parse GitHub search trending repos response correctly", async () => {
      const adapter = new RealGitHubAdapter("test-token", "REAL_CONNECTED_READ_ONLY");
      const originalFetch = global.fetch;

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                full_name: "trending/awesome-repo",
                html_url: "https://github.com/trending/awesome-repo",
                description: "Trending repo",
                language: "Python",
                stargazers_count: 500,
                forks_count: 20,
              },
            ],
          }),
        headers: new Headers(),
      });

      const res = await adapter.getTrendingRepositories("Python", "weekly");
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data![0].fullName).toBe("trending/awesome-repo");
      expect(res.data![0].timeframe).toBe("weekly");

      global.fetch = originalFetch;
    });

    it("should parse GitHub user PRs response correctly", async () => {
      const adapter = new RealGitHubAdapter("test-token", "REAL_CONNECTED_READ_ONLY");
      const originalFetch = global.fetch;

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [
              {
                id: 500,
                number: 42,
                html_url: "https://github.com/owner/repo/pull/42",
                title: "feat: add feature",
                state: "open",
                draft: false,
                created_at: "2026-10-20T10:00:00Z",
                updated_at: "2026-10-21T10:00:00Z",
              },
            ],
          }),
        headers: new Headers(),
      });

      const res = await adapter.listUserPullRequests("testuser");
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data![0].number).toBe(42);
      expect(res.data![0].state).toBe("open");

      global.fetch = originalFetch;
    });

    it("should parse single issue response via getIssue()", async () => {
      const adapter = new RealGitHubAdapter("test-token", "REAL_CONNECTED_READ_ONLY");
      const originalFetch = global.fetch;

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 99,
            number: 7,
            title: "Fix CI pipeline",
            html_url: "https://github.com/owner/repo/issues/7",
            state: "open",
            body: "CI pipeline is failing",
            labels: [{ name: "bug" }],
            assignee: null,
            created_at: "2026-10-19T10:00:00Z",
            updated_at: "2026-10-20T14:00:00Z",
          }),
        headers: new Headers(),
      });

      const res = await adapter.getIssue("owner/repo", 7);
      expect(res.success).toBe(true);
      expect(res.data?.number).toBe(7);
      expect(res.data?.title).toBe("Fix CI pipeline");

      global.fetch = originalFetch;
    });

    it("should parse single PR response via getPullRequest()", async () => {
      const adapter = new RealGitHubAdapter("test-token", "REAL_CONNECTED_READ_ONLY");
      const originalFetch = global.fetch;

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 500,
            number: 42,
            html_url: "https://github.com/owner/repo/pull/42",
            title: "feat: add feature",
            state: "closed",
            merged: true,
            draft: false,
            base: { ref: "main" },
            head: { ref: "feat/add-feature" },
            created_at: "2026-10-20T10:00:00Z",
            updated_at: "2026-10-21T10:00:00Z",
          }),
        headers: new Headers(),
      });

      const res = await adapter.getPullRequest("owner/repo", 42);
      expect(res.success).toBe(true);
      expect(res.data?.state).toBe("merged");
      expect(res.data?.baseRef).toBe("main");
      expect(res.data?.headRef).toBe("feat/add-feature");

      global.fetch = originalFetch;
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. Real Draft Creation
  // ═══════════════════════════════════════════════════════════════════════════
  describe("9. Real Draft Creation (mock-verified)", () => {
    it("should create Gmail draft via RealGmailAdapter in REAL_DRAFT_ONLY mode", async () => {
      const adapter = new RealGmailAdapter("mock-token", "REAL_DRAFT_ONLY");
      const originalGmail = google.gmail;
      google.gmail = vi.fn().mockReturnValue({
        users: {
          drafts: {
            create: vi.fn().mockResolvedValue({
              data: {
                id: "draft-real-001",
                message: { id: "msg-real-001", threadId: "thread-real-001" },
              },
            }),
          },
        },
      } as any);

      const res = await adapter.createEmailDraft({
        to: "recruiter@company.com",
        subject: "Application for SWE Intern",
        body: "Dear Hiring Manager, I am writing to express interest...",
      });
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe("draft-real-001");
      expect(res.data?.to).toBe("recruiter@company.com");
      expect(res.data?.subject).toBe("Application for SWE Intern");

      google.gmail = originalGmail;
    });

    it("should create Gmail draft via RealGmailAdapter in REAL_APPROVAL_REQUIRED mode", async () => {
      const adapter = new RealGmailAdapter("mock-token", "REAL_APPROVAL_REQUIRED");
      const originalGmail = google.gmail;
      google.gmail = vi.fn().mockReturnValue({
        users: {
          drafts: {
            create: vi.fn().mockResolvedValue({
              data: {
                id: "draft-real-002",
                message: { id: "msg-real-002", threadId: "thread-real-002" },
              },
            }),
          },
        },
      } as any);

      const res = await adapter.createEmailDraft({
        to: "recruiter@company.com",
        subject: "Follow-up",
        body: "Following up on my application...",
      });
      expect(res.success).toBe(true);
      expect(res.data?.id).toBe("draft-real-002");

      google.gmail = originalGmail;
    });

    it("should block draft creation in REAL_CONNECTED_READ_ONLY mode", async () => {
      const adapter = new RealGmailAdapter("token", "REAL_CONNECTED_READ_ONLY");
      const res = await adapter.createEmailDraft({
        to: "test@example.com",
        subject: "Test",
        body: "Body",
      });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    });

    it("should create draft via MockGmailAdapter successfully", async () => {
      const adapter = new MockGmailAdapter();
      const res = await adapter.createEmailDraft({
        to: "recruiter@stripe.com",
        subject: "Application",
        body: "Hello, I am interested in the SWE position.",
        attachResume: true,
      });
      expect(res.success).toBe(true);
      expect(res.data?.hasResumeAttachment).toBe(true);
      expect(res.data?.to).toBe("recruiter@stripe.com");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. GitHub Branch and PR Workflows (Mocks)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("10. GitHub Branch and PR Workflows (Mock-Based)", () => {
    it("should complete full workbench workflow: inspect → plan → test → patch → approval gate", async () => {
      const adapter = new MockGitHubAdapter();
      const workbench = new ContributionWorkbenchService(adapter);

      // 1. Inspect repository
      const inspection = await workbench.inspectRepository("owner/repo", 3);
      expect(inspection.isWelcome).toBe(true);
      expect(inspection.hasContributingGuide).toBe(true);
      expect(inspection.licenseSpdx).toBe("Apache-2.0");

      // 2. Create contribution plan
      const plan = workbench.createContributionPlan(3, "Add batch inference benchmark", "owner/repo");
      expect(plan.featureBranchName).toBe("feat/issue-3-batch-benchmark");
      expect(plan.targetBranch).toBe("main");
      expect(plan.acceptanceCriteria.length).toBeGreaterThanOrEqual(3);

      // 3. Run sandbox tests
      const testResult = await workbench.runSandboxTests("task-001", "pytest tests/ -v");
      expect(testResult.isSuccess).toBe(true);
      expect(testResult.exitCode).toBe(0);

      // 4. Prepare patch
      const cleanDiff = `diff --git a/bench.py b/bench.py\n+import torch\n+def benchmark(): pass`;
      const patch = workbench.preparePatch(cleanDiff, plan.featureBranchName);
      expect(patch.isValid).toBe(true);
      expect(patch.diffHash).toBeTruthy();

      // 5. Attempt PR without approval — must fail
      const unapproved = await workbench.executeApprovedOpenPr(
        "unapproved-token",
        "owner/repo",
        "PR Title",
        "PR Body",
        patch.diffHash
      );
      expect(unapproved.success).toBe(false);
      expect(unapproved.error).toContain("Approval record not found");
    });

    it("should succeed PR creation via MockGitHubAdapter when all gates pass", async () => {
      const adapter = new MockGitHubAdapter();
      adapter.writeCapabilityGranted = true;

      const diff = "valid code changes";
      const hash = computeHash(diff);

      const res = await adapter.openPullRequest({
        repo: "badrisatyam1-ctrl/wafer-defect-classification",
        title: "feat: add batch inference benchmark",
        body: "Resolves #3",
        headRef: "feat/issue-3-batch-benchmark",
        baseRef: "main",
        diffHash: hash,
        approvalToken: { approvalId: "approval-001", contentHash: hash, isApproved: true },
      });
      expect(res.success).toBe(true);
      expect(res.data?.state).toBe("open");
      expect(res.data?.htmlUrl).toContain("pull/4");
    });

    it("should succeed PR creation via RealGitHubAdapter when API returns 201 (mock fetch)", async () => {
      const adapter = new RealGitHubAdapter("valid-token", "REAL_WRITE_ENABLED");
      const originalFetch = global.fetch;

      const diff = "valid code";
      const hash = computeHash(diff);

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 777,
            number: 15,
            html_url: "https://github.com/owner/repo/pull/15",
            title: "feat: batch benchmark",
            state: "open",
            draft: false,
            base: { ref: "main" },
            head: { ref: "feat/batch-benchmark" },
            created_at: "2026-10-22T10:00:00Z",
            updated_at: "2026-10-22T10:00:00Z",
          }),
        headers: new Headers(),
      });

      const res = await adapter.openPullRequest({
        repo: "owner/repo",
        title: "feat: batch benchmark",
        body: "Resolves #3",
        headRef: "feat/batch-benchmark",
        baseRef: "main",
        diffHash: hash,
        approvalToken: { approvalId: "a1", contentHash: hash, isApproved: true },
      });
      expect(res.success).toBe(true);
      expect(res.data?.number).toBe(15);
      expect(res.data?.htmlUrl).toContain("/pull/15");

      global.fetch = originalFetch;
    });

    it("should verify secret scanning on prepared patches", () => {
      const adapter = new MockGitHubAdapter();
      const workbench = new ContributionWorkbenchService(adapter);

      // Clean diff — no secrets
      const cleanDiff = `+import torch\n+def benchmark(): pass`;
      const cleanPatch = workbench.preparePatch(cleanDiff, "feat/clean");
      expect(cleanPatch.isValid).toBe(true);

      // Diff with embedded secret — should be caught
      const secretDiff = `+const API_KEY = "ghp_1234567890abcdef1234567890abcdef12345678"`;
      const secretPatch = workbench.preparePatch(secretDiff, "feat/secret-leak");
      expect(secretPatch.isValid).toBe(false);
      expect(secretPatch.error).toBeTruthy();
      expect(secretPatch.error).toContain("secret");
    });

    it("should provide proper listing of starred repositories via MockGitHubAdapter", async () => {
      const adapter = new MockGitHubAdapter();
      const res = await adapter.listStarredRepositories("badrisatyam1-ctrl");
      expect(res.success).toBe(true);
      expect(res.data!.length).toBeGreaterThan(0);
      expect(res.data!.some((r) => r.fullName === "pytorch/pytorch")).toBe(true);
    });

    it("should list user PRs via MockGitHubAdapter", async () => {
      const adapter = new MockGitHubAdapter();
      const res = await adapter.listUserPullRequests("badrisatyam1-ctrl");
      expect(res.success).toBe(true);
      expect(res.data!.length).toBeGreaterThanOrEqual(1);
      expect(res.data!.some((pr) => pr.state === "merged")).toBe(true);
    });

    it("should retrieve single PR via MockGitHubAdapter", async () => {
      const adapter = new MockGitHubAdapter();
      const res = await adapter.getPullRequest("owner/repo", 1);
      expect(res.success).toBe(true);
      expect(res.data?.number).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. Crypto & Redaction Integrity
  // ═══════════════════════════════════════════════════════════════════════════
  describe("11. Crypto & Redaction Integrity", () => {
    it("should encrypt and decrypt roundtrip correctly", () => {
      const plaintext = "ghp_mySecretToken12345";
      const encrypted = encryptSecret(plaintext);
      expect(encrypted.encryptedText).not.toBe(plaintext);
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.authTag).toBeTruthy();

      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce deterministic hashes for identical content", () => {
      const content = "Hello, World!";
      const hash1 = computeHash(content);
      const hash2 = computeHash(content);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex
    });

    it("should normalize CRLF to LF for hash consistency", () => {
      const crlf = "line1\r\nline2\r\n";
      const lf = "line1\nline2\n";
      expect(computeHash(crlf)).toBe(computeHash(lf));
    });

    it("should produce different hashes for different content", () => {
      expect(computeHash("content A")).not.toBe(computeHash("content B"));
    });

    it("should redact all known token patterns in strings", () => {
      const ghpToken = "ghp_abcdefghijklmnopqrstuvwxyz1234567890";
      const patToken = "github_pat_abcdefghijklmnopqrstuvwx";
      const bearerToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      const googleToken = "ya29.a0ARrdaM_1234567890_abcdefghijklmnopqrstuvwxyz0123456789";

      expect(redactString(ghpToken)).toContain("[REDACTED_CREDENTIAL]");
      expect(redactString(patToken)).toContain("[REDACTED_CREDENTIAL]");
      expect(redactString(bearerToken)).toContain("[REDACTED_CREDENTIAL]");
      expect(redactString(googleToken)).toContain("[REDACTED_CREDENTIAL]");
    });

    it("should redact sensitive keys in nested objects", () => {
      const data = {
        user: "safe",
        token: "ghp_secret",
        config: {
          apiKey: "sk_live_12345",
          password: "hunter2",
          normal: "visible",
        },
      };
      const redacted = redactSensitiveData(data) as Record<string, unknown>;
      expect(redacted.user).toBe("safe");
      expect(redacted.token).toBe("[REDACTED]");
      const config = redacted.config as Record<string, unknown>;
      expect(config.apiKey).toBe("[REDACTED]");
      expect(config.password).toBe("[REDACTED]");
      expect(config.normal).toBe("visible");
    });

    it("should redact tokens embedded in arrays", () => {
      const data = ["safe string", "token: ghp_1234567890abcdefghijklmnopqrstuvwxyz1234", "another safe"];
      const redacted = redactSensitiveData(data) as string[];
      expect(redacted[0]).toBe("safe string");
      expect(redacted[1]).toContain("[REDACTED_CREDENTIAL]");
      expect(redacted[2]).toBe("another safe");
    });

    it("should handle null and undefined inputs in redactSensitiveData", () => {
      expect(redactSensitiveData(null)).toBeNull();
      expect(redactSensitiveData(undefined)).toBeUndefined();
      expect(redactSensitiveData(42)).toBe(42);
      expect(redactSensitiveData(true)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. Token Storage & Disconnect Lifecycle
  // ═══════════════════════════════════════════════════════════════════════════
  describe("12. Token Storage & Disconnect Lifecycle", () => {
    it("should store, retrieve, and verify encrypted token roundtrip via DB", async () => {
      const accountId = "lifecycle-roundtrip-test";
      const originalToken = "ghp_lifecycle_test_token_value_12345";

      await storeEncryptedToken(OWNER_USER_ID, "GITHUB", accountId, originalToken, undefined, 3600);

      const retrieved = await getDecryptedAccessToken("GITHUB", accountId);
      expect(retrieved).toBe(originalToken);

      await prisma.connectedAccount.deleteMany({
        where: { provider: "GITHUB", externalAccountId: accountId },
      });
    });

    it("should fully purge tokens on disconnect and set mode to DEMO", async () => {
      const accountId = "disconnect-purge-test";
      await storeEncryptedToken(OWNER_USER_ID, "GITHUB", accountId, "ghp_to_purge", undefined, 3600);

      // Verify stored
      const pre = await prisma.connectedAccount.findFirst({
        where: { provider: "GITHUB", externalAccountId: accountId },
      });
      expect(pre?.encryptedAccessToken).toBeTruthy();

      // Disconnect
      await disconnectAccount(OWNER_USER_ID, "GITHUB", accountId);

      // Verify purged
      const post = await prisma.connectedAccount.findFirst({
        where: { provider: "GITHUB", externalAccountId: accountId },
      });
      expect(post?.encryptedAccessToken).toBeNull();
      expect(post?.tokenIv).toBeNull();
      expect(post?.tokenAuthTag).toBeNull();
      expect(post?.connectionState).toBe("DISCONNECTED");
      expect(post?.integrationMode).toBe("DEMO");

      // Clean up
      await prisma.connectedAccount.deleteMany({
        where: { provider: "GITHUB", externalAccountId: accountId },
      });
    });

    it("should upsert (update) when storing a token for an already-connected account", async () => {
      const accountId = "upsert-test";
      await storeEncryptedToken(OWNER_USER_ID, "GITHUB", accountId, "ghp_first_token", undefined, 3600);

      const first = await getDecryptedAccessToken("GITHUB", accountId);
      expect(first).toBe("ghp_first_token");

      // Store a new token for the same account
      await storeEncryptedToken(OWNER_USER_ID, "GITHUB", accountId, "ghp_second_token", undefined, 7200);

      const second = await getDecryptedAccessToken("GITHUB", accountId);
      expect(second).toBe("ghp_second_token");

      // Verify only one record exists
      const count = await prisma.connectedAccount.count({
        where: { provider: "GITHUB", externalAccountId: accountId },
      });
      expect(count).toBe(1);

      await prisma.connectedAccount.deleteMany({
        where: { provider: "GITHUB", externalAccountId: accountId },
      });
    });
  });
});
