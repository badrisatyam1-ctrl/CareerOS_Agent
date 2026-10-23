import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { CareerNetworkingService } from "@/modules/networking/service";
import { prisma } from "@/lib/db";

describe("Career Networking: Anti-Spam, Deduplication & Policy Guards", () => {
  let service: CareerNetworkingService;

  beforeEach(() => {
    service = new CareerNetworkingService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Ranked Leads & Source Provenance
  describe("Ranked Recommendations & Source Provenance", () => {
    it("should return ranked leads with valid public source provenance", () => {
      const leads = service.getRankedLeads();
      expect(leads.length).toBeGreaterThan(0);

      for (const lead of leads) {
        expect(lead.fullName).toBeTruthy();
        expect(lead.company).toBeTruthy();
        expect(lead.provenanceUrl).toMatch(/^https:\/\//);
        expect(lead.sharedTechnicalReason.commonDomain).toBeTruthy();
      }
    });

    it("should filter leads by category correctly", () => {
      const engineers = service.getRankedLeads("ENGINEER_MAINTAINER");
      expect(engineers.every((l) => l.category === "ENGINEER_MAINTAINER")).toBe(true);

      const recruiters = service.getRankedLeads("RECRUITER_TALENT");
      expect(recruiters.every((l) => l.category === "RECRUITER_TALENT")).toBe(true);
    });
  });

  // 2. Connection Note Constraints (LinkedIn 300-char limit)
  describe("Connection Note Constraints", () => {
    it("should ensure every connection note is strictly within LinkedIn's 300 character limit", () => {
      const leads = service.getRankedLeads();
      for (const lead of leads) {
        expect(lead.connectionNote.characterCount).toBeLessThanOrEqual(300);
        expect(lead.connectionNote.isWithinLimit).toBe(true);
      }
    });

    it("should provide safe manual handoff with note text and profile URL", () => {
      const handoff = service.getManualHandoff("lead-rohit-cloudflare");
      expect(handoff.noteText).toContain("Systems India");
      expect(handoff.characterCount).toBeLessThanOrEqual(300);
      expect(handoff.profileUrl).toContain("linkedin.com");
      expect(handoff.isSafeLength).toBe(true);
    });
  });

  // 3. Anti-Spam: 60-Day Deduplication & Daily Cap
  describe("Anti-Spam & Deduplication Policy", () => {
    it("should permit initial outreach for uncontacted leads", () => {
      const eligibility = service.checkAntiSpamEligibility("lead-rohit-cloudflare");
      expect(eligibility.isEligible).toBe(true);
    });

    it("should block outreach if recipient was contacted within the 60-day window", async () => {
      // First, confirm contact
      await service.markAsContacted("demo-user-badri", "lead-rohit-cloudflare");

      // Attempt to check eligibility again immediately
      const eligibility = service.checkAntiSpamEligibility("lead-rohit-cloudflare");
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.reason).toContain("60-day deduplication window");
    });

    it("should block outreach to leads marked as DO_NOT_CONTACT", async () => {
      await service.setDoNotContact("demo-user-badri", "lead-priya-qualcomm", "User preference");

      const eligibility = service.checkAntiSpamEligibility("lead-priya-qualcomm");
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.reason).toContain("DO_NOT_CONTACT");
    });
  });

  // 4. Human Confirmation Gate
  describe("Human Confirmation Gate", () => {
    it("should not mark lead as contacted until user explicitly confirms it", () => {
      const lead = service.getRankedLeads().find((l) => l.id === "lead-viktor-maintainer");
      expect(lead?.connectionState).toBe("IDENTIFIED");
      expect(lead?.lastContactedAt).toBeUndefined();
    });

    it("should update state to CONTACTED and set timestamp upon explicit user confirmation", async () => {
      const result = await service.markAsContacted("demo-user-badri", "lead-viktor-maintainer");
      expect(result.success).toBe(true);
      expect(result.lead.connectionState).toBe("CONTACTED");
      expect(result.lead.lastContactedAt).toBeDefined();
    });
  });
});
