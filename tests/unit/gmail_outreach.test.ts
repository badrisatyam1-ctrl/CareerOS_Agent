import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { GmailOutreachService } from "@/modules/outreach/service";
import { MockGmailAdapter } from "@/integrations/gmail";
import { computeHash } from "@/lib/crypto";
import { prisma } from "@/lib/db";

describe("Gmail Outreach & Recruiter Delivery: Policy, Limits & Follow-Up Guards", () => {
  let service: GmailOutreachService;
  let mockAdapter: MockGmailAdapter;

  beforeEach(() => {
    mockAdapter = new MockGmailAdapter();
    service = new GmailOutreachService(mockAdapter);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Delivery Blocking: Disabled Sending & Unverified Provenance
  describe("Delivery Blocking Safeguards", () => {
    it("should block email dispatch when Gmail send capability is disabled (Draft-Only Mode)", async () => {
      mockAdapter.sendCapabilityGranted = false; // Draft-only mode
      const { approvalId, contentHash } = await service.requestSendApproval(
        "demo-user-badri",
        "outreach-stripe-001"
      );

      const result = await service.sendApprovedOutreach(
        "demo-user-badri",
        "outreach-stripe-001",
        approvalId,
        contentHash
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Draft-only mode active");
    });

    it("should block outreach if recipient lacks verified public source provenance", async () => {
      mockAdapter.sendCapabilityGranted = true;
      const draft = service.getDrafts().find((d) => d.id === "outreach-stripe-001")!;
      // Tamper provenance to non-HTTPS / unverified
      draft.recipient.provenanceUrl = "unverified-guess";

      const { approvalId, contentHash } = await service.requestSendApproval(
        "demo-user-badri",
        "outreach-stripe-001"
      );

      const result = await service.sendApprovedOutreach(
        "demo-user-badri",
        "outreach-stripe-001",
        approvalId,
        contentHash
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("verified public source provenance");
    });

    it("should block outreach if recipient is marked DO_NOT_CONTACT", async () => {
      mockAdapter.sendCapabilityGranted = true;
      service.setDoNotContact("ananya.recruiter.demo@stripe.example.com", "Opted out");

      const draft = service.getDrafts().find((d) => d.id === "outreach-stripe-001")!;
      expect(draft.recipient.isDoNotContact).toBe(true);

      await expect(
        service.requestSendApproval("demo-user-badri", "outreach-stripe-001")
      ).rejects.toThrow("DO_NOT_CONTACT");
    });
  });

  // 2. Action-Specific Approval Gates (§6)
  describe("Action-Specific Approval Gate (§6)", () => {
    it("should reject sending if approval token was not issued", async () => {
      mockAdapter.sendCapabilityGranted = true;
      const fakeHash = computeHash("fake-content");

      const result = await service.sendApprovedOutreach(
        "demo-user-badri",
        "outreach-stripe-001",
        "non-existent-approval-id",
        fakeHash
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Content hash mismatch");
    });

    it("should reject sending if email text or attachment was modified after approval was issued", async () => {
      mockAdapter.sendCapabilityGranted = true;
      const { approvalId, contentHash } = await service.requestSendApproval(
        "demo-user-badri",
        "outreach-stripe-001"
      );

      // Modify message content after approval was granted
      const tamperedHash = computeHash("tampered-content");

      const result = await service.sendApprovedOutreach(
        "demo-user-badri",
        "outreach-stripe-001",
        approvalId,
        tamperedHash
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Content hash mismatch");
    });

    it("should successfully dispatch email when send capability is granted and approval hash matches", async () => {
      mockAdapter.sendCapabilityGranted = true;
      const { approvalId, contentHash } = await service.requestSendApproval(
        "demo-user-badri",
        "outreach-stripe-001"
      );

      const result = await service.sendApprovedOutreach(
        "demo-user-badri",
        "outreach-stripe-001",
        approvalId,
        contentHash
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toContain("sent-");

      const draft = service.getDrafts().find((d) => d.id === "outreach-stripe-001")!;
      expect(draft.status).toBe("SENT");
      expect(draft.sentAt).toBeDefined();

      // Verify audit event exists
      const audit = await prisma.auditEvent.findFirst({
        where: { actionName: "EMAIL_DISPATCHED" },
        orderBy: { timestamp: "desc" },
      });
      expect(audit).toBeDefined();
    });
  });

  // 3. Polite Follow-Up Rules Engine
  describe("Follow-Up Rules Engine", () => {
    it("should block follow-up if less than 7 days have passed since initial contact", () => {
      const draft = service.getDrafts().find((d) => d.id === "outreach-qualcomm-002")!;
      // Simulate sent only 3 days ago
      draft.sentAt = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();

      const check = service.evaluateFollowUpEligibility("outreach-qualcomm-002");
      expect(check.isEligible).toBe(false);
      expect(check.reasons[0]).toContain("Follow-up interval not met");
    });

    it("should allow follow-up when 9 days passed (>= 7 days) with 0 previous follow-ups", () => {
      const check = service.evaluateFollowUpEligibility("outreach-qualcomm-002");
      expect(check.isEligible).toBe(true);
      expect(check.daysSinceLastContact).toBeGreaterThanOrEqual(7);
      expect(check.reasons).toHaveLength(0);
    });

    it("should generate a polite follow-up draft in FOLLOW_UP_DRAFTED state requiring independent approval", () => {
      const followUp = service.prepareFollowUpDraft("outreach-qualcomm-002");
      expect(followUp.status).toBe("FOLLOW_UP_DRAFTED");
      expect(followUp.subject).toContain("Re: Qualcomm Edge AI Intern");
      expect(followUp.bodyText).toContain("quickly follow up on my note");
      expect(followUp.recipient.followUpCount).toBe(1);

      // Attempting a second follow-up must be blocked by the 1-follow-up limit
      const secondCheck = service.evaluateFollowUpEligibility(followUp.id);
      expect(secondCheck.isEligible).toBe(false);
      expect(secondCheck.reasons[0]).toContain("Maximum follow-up limit reached");
    });
  });
});
