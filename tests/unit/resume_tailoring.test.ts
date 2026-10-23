import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { ResumeTailoringService } from "@/modules/resume/service";
import { JobOpeningItem } from "@/modules/jobs/types";
import { prisma } from "@/lib/db";

describe("Resume Tailoring: Zero-Fabrication & Truth Enforcement Guards", () => {
  let service: ResumeTailoringService;

  beforeEach(() => {
    service = new ResumeTailoringService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const backendJob: JobOpeningItem = {
    id: "job-backend-test",
    canonicalUrl: "https://boards.greenhouse.io/stripe/jobs/backend-intern",
    companyName: "Stripe",
    roleTitle: "Software Engineering Intern - Infrastructure",
    location: "Remote (India)",
    workMode: "REMOTE",
    roleType: "INTERN",
    description: "Build robust distributed backend payment rails in Go, TypeScript, and SQL. Focus on concurrency and distributed transactions.",
    postedAt: new Date().toISOString(),
    firstSeenAt: new Date().toISOString(),
    dedupeHash: "dedupe-backend-test",
    status: "ACTIVE",
    isPaid: true,
    sourcePlatform: "GREENHOUSE_PUBLIC",
    requiredSkills: ["TypeScript", "SQL", "Git", "Go", "Kafka"],
    preferredSkills: ["Redis"],
  };

  const cvJob: JobOpeningItem = {
    id: "job-cv-test",
    canonicalUrl: "https://careers.qualcomm.com/cv-intern",
    companyName: "Qualcomm",
    roleTitle: "Computer Vision & Edge AI Intern",
    location: "Noida",
    workMode: "HYBRID",
    roleType: "INTERN",
    description: "Deep learning models in PyTorch for defect inspection and edge computer vision inference.",
    postedAt: new Date().toISOString(),
    firstSeenAt: new Date().toISOString(),
    dedupeHash: "dedupe-cv-test",
    status: "ACTIVE",
    isPaid: true,
    sourcePlatform: "COMPANY_SITE",
    requiredSkills: ["Python", "PyTorch", "Computer Vision"],
    preferredSkills: [],
  };

  // 1. Zero Fabrication: Unsupported Claims Rejection
  describe("Zero-Fabrication Hard Boundary", () => {
    it("should intercept and reject attempts to insert unverified patent claims", () => {
      const check = service.validateClaimAgainstVault("Patented WaferOS semiconductor detection algorithm");
      expect(check.isVerified).toBe(false);
      expect(check.error).toContain("forbids fabricating credentials");
    });

    it("should intercept and reject attempts to insert unverified cloud architect certifications", () => {
      const check = service.validateClaimAgainstVault("AWS Certified Solutions Architect Professional");
      expect(check.isVerified).toBe(false);
      expect(check.error).toContain("forbids fabricating credentials");
    });

    it("should intercept and reject exaggerated metrics (e.g. '100x faster', 'saved $10M')", () => {
      const check1 = service.validateClaimAgainstVault("Engineered system resulting in 100x faster indexing");
      expect(check1.isVerified).toBe(false);

      const check2 = service.validateClaimAgainstVault("Saved $500,000 in cloud compute costs");
      expect(check2.isVerified).toBe(false);
    });

    it("should omit job required skills that are absent from evidence vault rather than fabricating them", () => {
      const variant = service.tailorResumeForJob(backendJob);
      // "Go" and "Kafka" are in JD, but Badri's evidence vault does not claim them
      expect(variant.skillGapsOmitted).toContain("Go");
      expect(variant.skillGapsOmitted).toContain("Kafka");
      // Must NOT appear in highlighted verified skills
      expect(variant.matchedSkillsHighlighted).not.toContain("Go");
      expect(variant.matchedSkillsHighlighted).not.toContain("Kafka");
      // Verified skills MUST be present
      expect(variant.matchedSkillsHighlighted).toContain("TypeScript");
      expect(variant.matchedSkillsHighlighted).toContain("SQL");
    });
  });

  // 2. Truthful Project Prioritization
  describe("Project Prioritization & Truthful Ordering", () => {
    it("should prioritize TravelBooking (distributed locks) as primary project for backend roles", () => {
      const variant = service.tailorResumeForJob(backendJob);
      expect(variant.changedBullets[0].tailoredBullet).toContain("Prioritized TravelBooking");
      expect(variant.markdownContent).toMatch(/### 1\. TravelBooking/);
    });

    it("should prioritize WaferOS (PyTorch defect detection) as primary project for computer vision roles", () => {
      const variant = service.tailorResumeForJob(cvJob);
      expect(variant.changedBullets[0].tailoredBullet).toContain("Prioritized WaferOS");
      expect(variant.markdownContent).toMatch(/### 1\. WaferOS/);
    });
  });

  // 3. Graduation Date Discrepancy Sentinel
  describe("Graduation Date Mismatch Sentinel", () => {
    it("should flag discrepancy when resume indicates 2028 and LinkedIn indicates 2027", () => {
      const variant = service.tailorResumeForJob(backendJob, 2027); // 2027 LinkedIn vs 2028 Resume
      expect(variant.graduationMismatchFlag).toBeDefined();
      expect(variant.graduationMismatchFlag).toContain("Resume indicates 2028, while LinkedIn indicates 2027");
    });

    it("should not flag discrepancy when graduation years are consistent", () => {
      const variant = service.tailorResumeForJob(backendJob, 2028); // 2028 LinkedIn matches 2028 Resume
      expect(variant.graduationMismatchFlag).toBeUndefined();
    });
  });

  // 4. Immutability & Approval Gates
  describe("Immutability & Approval Hashing", () => {
    it("should keep base resume immutable when tailoring variants", () => {
      const baseBefore = service.getBaseResume();
      const variant = service.tailorResumeForJob(backendJob);
      const baseAfter = service.getBaseResume();

      expect(baseBefore.verifiedSkills).toEqual(baseAfter.verifiedSkills);
      expect(baseBefore.education.graduationYear).toBe(2028);
      expect(variant.isBaseImmutable).toBe(true);
    });

    it("should compute SHA-256 approval hash upon explicit user approval", async () => {
      const variant = service.tailorResumeForJob(backendJob);
      expect(variant.isApproved).toBe(false);
      expect(variant.approvalHash).toBeUndefined();

      const res = await service.approveResumeVariant("demo-user-badri", variant);
      expect(res.success).toBe(true);
      expect(variant.isApproved).toBe(true);
      expect(variant.approvalHash).toHaveLength(64); // SHA-256 hex length
    });
  });
});
