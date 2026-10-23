import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { CareerNetworkingService } from "@/modules/networking/service";
import { prisma } from "@/lib/db";

describe("Career Networking: Real Database Operations, CRUD & Search Filters", () => {
  let service: CareerNetworkingService;

  beforeEach(() => {
    service = new CareerNetworkingService();
  });

  afterAll(async () => {
    // Clean up test leads if any created
    await prisma.networkLead.deleteMany({
      where: {
        id: { startsWith: "test-lead-" },
      },
    });
    await prisma.$disconnect();
  });

  // 1. Initial Seeding & Real Data Retrieval
  describe("Initial Seeding & Real Data Integrity", () => {
    it("should seed database with verified real leads (Francisco Massa, Jeremy Howard, Limor Fried, etc.)", async () => {
      await service.seedInitialLeadsIfEmpty();
      const leads = await service.getLeadsFromDb();

      expect(leads.length).toBeGreaterThanOrEqual(4);
      // Verify no fake demo URLs
      for (const lead of leads) {
        expect(lead.profileUrl).not.toContain("demo-");
        expect(lead.provenanceUrl).toMatch(/^https:\/\//);
        expect(lead.connectionNote.characterCount).toBeLessThanOrEqual(300);
      }
    });

    it("should find real PyTorch Vision maintainer with verified background match", async () => {
      const leads = await service.getLeadsFromDb({ search: "Francisco" });
      expect(leads.length).toBe(1);
      const francisco = leads[0];
      expect(francisco.fullName).toBe("Francisco Massa");
      expect(francisco.company).toContain("PyTorch");
      expect(francisco.connectionNote.text).toContain("torchvision");
      expect(francisco.connectionNote.text).toContain("WaferOS");
    });
  });

  // 2. Search & Filter Capabilities
  describe("Search & Multi-Dimensional Filtering", () => {
    it("should filter by category accurately", async () => {
      const hardwareLeads = await service.getLeadsFromDb({ category: "EMBEDDED_HARDWARE" });
      expect(hardwareLeads.length).toBeGreaterThanOrEqual(1);
      expect(hardwareLeads.every((l) => l.category === "EMBEDDED_HARDWARE")).toBe(true);
    });

    it("should search across domain, role, and skills", async () => {
      const visionLeads = await service.getLeadsFromDb({ search: "Computer Vision" });
      expect(visionLeads.length).toBeGreaterThanOrEqual(1);
      expect(visionLeads.some((l) => l.domainFocus.includes("Computer Vision"))).toBe(true);
    });

    it("should return empty list when no matches found", async () => {
      const nonExistent = await service.getLeadsFromDb({ search: "NonExistentPersonName123XYZ" });
      expect(nonExistent.length).toBe(0);
    });
  });

  // 3. User-Entered Contact Creation & Auto-Drafting
  describe("Add Real Contact & Evidence-Backed Note Generation", () => {
    it("should create user-entered contact and auto-generate compliant note (<300 chars)", async () => {
      const newContact = await service.createLeadInDb({
        fullName: "Dr. Aakash Verma",
        roleTitle: "Lead Computer Vision Scientist",
        company: "Robotics Research India",
        category: "ENGINEER_MAINTAINER",
        profileUrl: "https://www.linkedin.com/in/aakash-verma-cv",
        provenanceUrl: "https://arxiv.org/abs/2301.12345",
        domainFocus: "Computer Vision & Edge Defect Detection",
        relevanceEvidence: "Author of paper on defect inspection algorithms.",
        notes: "Discussed wafer defect models at CVPR workshop.",
        followUpDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      });

      expect(newContact.id).toBeTruthy();
      expect(newContact.fullName).toBe("Dr. Aakash Verma");
      expect(newContact.connectionNote.characterCount).toBeLessThanOrEqual(300);
      expect(newContact.connectionNote.isWithinLimit).toBe(true);
      expect(newContact.connectionNote.text).toContain("WaferOS");

      // Verify retrieval from DB
      const fetched = await service.getLeadsFromDb({ search: "Aakash Verma" });
      expect(fetched.length).toBe(1);
      expect(fetched[0].notes).toBe("Discussed wafer defect models at CVPR workshop.");

      // Clean up
      await service.deleteLeadFromDb(newContact.id);
    });
  });

  // 4. Persistence of Contact Confirmation, Notes & DNC
  describe("Persistence & Status Workflow", () => {
    it("should persist 'Confirm Contacted' state and timestamp across queries", async () => {
      const tempLead = await service.createLeadInDb({
        fullName: "Siddharth Rao",
        roleTitle: "Staff Platform Architect",
        company: "Zepto Infra",
        category: "ENGINEER_MAINTAINER",
        profileUrl: "https://www.linkedin.com/in/siddharth-rao-infra",
        provenanceUrl: "https://github.com/zepto/open-infra",
        domainFocus: "Distributed Systems & High Concurrency",
      });

      // Confirm contacted
      const updated = await service.markAsContactedInDb("demo-user-badri", tempLead.id, "Sent connection note via LinkedIn");
      expect(updated.connectionState).toBe("CONTACTED");
      expect(updated.lastContactedAt).toBeTruthy();

      // Query from DB to verify persistence
      const reloaded = await service.getLeadsFromDb({ search: "Siddharth Rao" });
      expect(reloaded[0].connectionState).toBe("CONTACTED");
      expect(reloaded[0].lastContactedAt).toBeTruthy();

      // Clean up
      await service.deleteLeadFromDb(tempLead.id);
    });

    it("should persist Do-Not-Contact blacklist in Postgres", async () => {
      const tempLead = await service.createLeadInDb({
        fullName: "Spammy Recruiter",
        roleTitle: "Agency Sourcing Rep",
        company: "Bulk Agency",
        category: "RECRUITER_TALENT",
        profileUrl: "https://www.linkedin.com/in/agency-rep",
        provenanceUrl: "https://bulkagency.example.com",
        domainFocus: "General Staffing",
      });

      await service.setDoNotContactInDb("demo-user-badri", tempLead.id, "Candidate requested exclusion");

      const reloaded = await service.getLeadsFromDb({ search: "Spammy Recruiter" });
      expect(reloaded[0].isDoNotContact).toBe(true);
      expect(reloaded[0].connectionState).toBe("DO_NOT_CONTACT");

      // Clean up
      await service.deleteLeadFromDb(tempLead.id);
    });
  });
});
