import { describe, it, expect, beforeEach } from "vitest";
import { MockGitHubAdapter } from "@/integrations/github";
import { MockGmailAdapter } from "@/integrations/gmail";
import { MockLinkedInAdapter } from "@/integrations/linkedin";
import { MockJobSourceAdapter } from "@/integrations/jobs";
import { MockAIModelAdapter } from "@/integrations/ai";
import { computeHash } from "@/lib/crypto";

describe("Provider Adapters: Failure Modes & Approval Gates", () => {
  let github: MockGitHubAdapter;
  let gmail: MockGmailAdapter;
  let linkedin: MockLinkedInAdapter;
  let jobSearch: MockJobSourceAdapter;
  let aiModel: MockAIModelAdapter;

  beforeEach(() => {
    github = new MockGitHubAdapter();
    gmail = new MockGmailAdapter();
    linkedin = new MockLinkedInAdapter();
    jobSearch = new MockJobSourceAdapter();
    aiModel = new MockAIModelAdapter();
  });

  // 1. GitHub Adapter Tests
  describe("GitHub Adapter", () => {
    it("should list repositories successfully in normal state", async () => {
      const res = await github.listRepositories("badrisatyam1-ctrl");
      expect(res.success).toBe(true);
      expect(res.data?.length).toBeGreaterThanOrEqual(2);
      expect(res.data?.[0].primaryLanguage).toBe("Python");
    });

    it("should handle EXPIRED_CREDENTIALS safely", async () => {
      github.simulateExpired = true;
      const res = await github.listRepositories("badrisatyam1-ctrl");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("EXPIRED_CREDENTIALS");
      expect(res.error?.statusCode).toBe(401);
    });

    it("should handle REVOKED_ACCESS safely", async () => {
      github.simulateRevoked = true;
      const res = await github.listIssues("badrisatyam1-ctrl/wafer-defect-classification");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("REVOKED_ACCESS");
      expect(res.error?.statusCode).toBe(403);
    });

    it("should handle PROVIDER_OUTAGE (503 Service Unavailable)", async () => {
      github.simulateOutage = true;
      const res = await github.listRepositories("badrisatyam1-ctrl");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("PROVIDER_OUTAGE");
      expect(res.error?.retryable).toBe(true);
    });

    it("should handle RATE_LIMITED (429)", async () => {
      github.simulateRateLimit = true;
      const res = await github.listRepositories("badrisatyam1-ctrl");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("RATE_LIMITED");
    });

    it("should block PR creation when write capability is not enabled (read-only default)", async () => {
      github.writeCapabilityGranted = false; // Default
      const diffHash = computeHash("diff-test-content");

      const res = await github.openPullRequest({
        repo: "badrisatyam1-ctrl/wafer-defect-classification",
        title: "Test PR",
        body: "Test body",
        baseRef: "main",
        headRef: "feat/test",
        diffHash,
        approvalToken: {
          approvalId: "appr-1",
          contentHash: diffHash,
          isApproved: true,
        },
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
      expect(res.error?.message).toContain("write capability is not enabled");
    });

    it("should block PR creation if diff hash differs from approval hash", async () => {
      github.writeCapabilityGranted = true;
      const originalDiffHash = computeHash("original-diff");
      const tamperedDiffHash = computeHash("tampered-diff");

      const res = await github.openPullRequest({
        repo: "badrisatyam1-ctrl/wafer-defect-classification",
        title: "Test PR",
        body: "Test body",
        baseRef: "main",
        headRef: "feat/test",
        diffHash: tamperedDiffHash, // Mismatched!
        approvalToken: {
          approvalId: "appr-1",
          contentHash: originalDiffHash,
          isApproved: true,
        },
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("APPROVAL_MISMATCH");
    });

    it("should allow PR creation when write capability is granted and diff hash matches approval", async () => {
      github.writeCapabilityGranted = true;
      const diffHash = computeHash("valid-diff-content");

      const res = await github.openPullRequest({
        repo: "badrisatyam1-ctrl/wafer-defect-classification",
        title: "feat: add batch inference",
        body: "Resolves #3",
        baseRef: "main",
        headRef: "feat/batch-inference",
        diffHash,
        approvalToken: {
          approvalId: "appr-1",
          contentHash: diffHash,
          isApproved: true,
        },
      });

      expect(res.success).toBe(true);
      expect(res.data?.number).toBe(4);
      expect(res.data?.state).toBe("open");
    });
  });

  // 2. Gmail Adapter Tests
  describe("Gmail Adapter", () => {
    it("should create email drafts in draft-only mode without sending", async () => {
      const res = await gmail.createEmailDraft({
        to: "recruiter@example.com",
        subject: "Internship Inquiry",
        body: "Hello, I am interested in the Backend Intern opening.",
      });

      expect(res.success).toBe(true);
      expect(res.data?.to).toBe("recruiter@example.com");
      expect(res.data?.id).toBeDefined();
    });

    it("should block sending email when send capability is not granted (draft-only guard)", async () => {
      gmail.sendCapabilityGranted = false; // Default
      const body = "Test message";
      const hash = computeHash(body);

      const res = await gmail.sendApprovedEmail({
        draftId: "draft-1",
        to: "recruiter@example.com",
        subject: "Subject",
        body,
        approvalToken: {
          approvalId: "appr-1",
          contentHash: hash,
          isApproved: true,
        },
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
      expect(res.error?.message).toContain("send capability is not enabled");
    });

    it("should reject sending email if body hash was altered after approval", async () => {
      gmail.sendCapabilityGranted = true;
      const originalBody = "Original approved email body text.";
      const originalHash = computeHash(originalBody);
      const tamperedBody = "Tampered email body text.";

      const res = await gmail.sendApprovedEmail({
        draftId: "draft-1",
        to: "recruiter@example.com",
        subject: "Subject",
        body: tamperedBody,
        approvalToken: {
          approvalId: "appr-1",
          contentHash: originalHash,
          isApproved: true,
        },
      });

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("APPROVAL_MISMATCH");
    });

    it("should send email when send capability is granted and hash matches", async () => {
      gmail.sendCapabilityGranted = true;
      const body = "Verified 1-to-1 outreach body.";
      const hash = computeHash(body);

      const res = await gmail.sendApprovedEmail({
        draftId: "draft-1",
        to: "recruiter@example.com",
        subject: "Internship Inquiry",
        body,
        approvalToken: {
          approvalId: "appr-1",
          contentHash: hash,
          isApproved: true,
        },
      });

      expect(res.success).toBe(true);
      expect(res.data?.recipient).toBe("recruiter@example.com");
    });
  });

  // 3. LinkedIn Adapter Tests
  describe("LinkedIn Adapter", () => {
    it("should reject post draft if no verified evidence references are provided", async () => {
      const res = await linkedin.createDraft(
        "AI Architecture",
        "Fabricated claim with no repo link",
        [], // No evidence!
        ["#AI"]
      );

      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
      expect(res.error?.message).toContain("Every technical claim must link to at least one verified evidence source");
    });

    it("should route to MANUAL_HANDOFF mode when official member social publishing scope is absent", async () => {
      linkedin.hasOfficialMemberSocialScope = false; // Default posture
      const content = "Reflecting on WaferOS defect classification architecture.";
      const hash = computeHash(content);

      const res = await linkedin.publishPost({
        content,
        evidenceSources: ["https://github.com/badrisatyam1-ctrl/wafer-defect-classification"],
        approvalToken: {
          approvalId: "appr-1",
          contentHash: hash,
          isApproved: true,
        },
      });

      expect(res.success).toBe(true);
      expect(res.data?.mode).toBe("MANUAL_HANDOFF");
      expect(res.data?.postUrl).toContain("shareActive=true");
    });
  });

  // 4. Job Search & AI Adapters
  describe("Job Search and AI Adapters", () => {
    it("should return normalized job openings without scraping", async () => {
      const res = await jobSearch.searchListings({
        keywords: ["Backend", "Intern"],
        locations: ["Remote", "India"],
      });

      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(2);
      expect(res.data?.[0].companyName).toBe("Stripe");
      expect(res.data?.[0].dedupeHash).toBeDefined();
    });

    it("should handle job search outage gracefully", async () => {
      jobSearch.simulateOutage = true;
      const res = await jobSearch.searchListings({ keywords: ["SWE"], locations: ["Remote"] });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("PROVIDER_OUTAGE");
    });

    it("should generate schema-validated structured output via AI adapter", async () => {
      const res = await aiModel.generateStructuredOutput({
        systemPrompt: "Score candidate match",
        userPrompt: "Assess skills against backend JD",
        schema: null as any,
      });

      expect(res.success).toBe(true);
      expect((res.data as any).overallFitScore).toBe(92.5);
    });
  });
});
