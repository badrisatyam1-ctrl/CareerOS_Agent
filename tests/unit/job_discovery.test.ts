import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { JobDiscoveryService } from "@/modules/jobs/service";
import {
  calculateJobMatch,
  computeJobDedupeKey,
  detectSuspiciousOrExpired,
} from "@/modules/jobs/matcher";
import { JobOpeningItem } from "@/modules/jobs/types";
import { prisma } from "@/lib/db";

describe("Job Discovery & Matching: Rubric, Deduplication & Policy Guards", () => {
  let service: JobDiscoveryService;

  beforeEach(() => {
    service = new JobDiscoveryService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Date Eligibility & Hard Blockers
  describe("Graduation Date Eligibility Guard", () => {
    it("should mark roles requiring 2024 or earlier graduation as INELIGIBLE for a 2028 graduate", () => {
      const seniorJob: JobOpeningItem = {
        id: "senior-role-1",
        canonicalUrl: "https://boards.greenhouse.io/demo/senior-dev",
        companyName: "Acme Corp",
        roleTitle: "Senior Backend Engineer",
        location: "Remote",
        workMode: "REMOTE",
        roleType: "FULL_TIME",
        description: "Must have graduated by 2024 or earlier.",
        postedAt: new Date().toISOString(),
        firstSeenAt: new Date().toISOString(),
        dedupeHash: "hash-senior-1",
        status: "ACTIVE",
        isPaid: true,
        sourcePlatform: "GREENHOUSE_PUBLIC",
        maxGraduationYear: 2024,
        requiredSkills: ["Python", "SQL"],
        preferredSkills: [],
      };

      const match = calculateJobMatch(seniorJob, 2028);
      expect(match.eligibilityStatus).toBe("INELIGIBLE");
      expect(match.hardBlockers.length).toBeGreaterThan(0);
      expect(match.hardBlockers[0]).toContain("Graduation year requirement mismatch");
      expect(match.overallFitScore).toBeLessThanOrEqual(35); // Capped due to hard blocker
    });

    it("should mark roles accepting 2027 graduates as ELIGIBLE", () => {
      const internJob: JobOpeningItem = {
        id: "intern-role-1",
        canonicalUrl: "https://boards.greenhouse.io/stripe/swe-intern-2025",
        companyName: "Stripe",
        roleTitle: "Software Engineering Intern",
        location: "Remote",
        workMode: "REMOTE",
        roleType: "INTERN",
        description: "Open to 2026/2027 graduates.",
        postedAt: new Date().toISOString(),
        firstSeenAt: new Date().toISOString(),
        dedupeHash: "hash-intern-1",
        status: "ACTIVE",
        isPaid: true,
        sourcePlatform: "GREENHOUSE_PUBLIC",
        minGraduationYear: 2026,
        maxGraduationYear: 2027,
        requiredSkills: ["TypeScript", "SQL", "Git"],
        preferredSkills: ["Go"],
      };

      const match = calculateJobMatch(internJob, 2027);
      expect(match.eligibilityStatus).toBe("ELIGIBLE");
      expect(match.hardBlockers).toHaveLength(0);
      expect(match.overallFitScore).toBeGreaterThan(70);
    });
  });

  // 2. Hard Blockers vs Soft Skill Gaps
  describe("Separation of Hard Blockers from Soft Skill Gaps", () => {
    it("should classify US citizenship requirements as Hard Blockers, and missing tech skills as Soft Gaps", () => {
      const clearanceJob: JobOpeningItem = {
        id: "defense-job-1",
        canonicalUrl: "https://careers.defense.com/job/1",
        companyName: "Defense Tech",
        roleTitle: "Systems Engineer",
        location: "Delhi",
        workMode: "ON_SITE",
        roleType: "FULL_TIME",
        description: "Active security clearance required. US Citizenship required.",
        postedAt: new Date().toISOString(),
        firstSeenAt: new Date().toISOString(),
        dedupeHash: "hash-defense-1",
        status: "ACTIVE",
        isPaid: true,
        sourcePlatform: "COMPANY_SITE",
        requiredSkills: ["Python", "Rust", "Kubernetes"],
        preferredSkills: [],
      };

      const match = calculateJobMatch(clearanceJob, 2027);
      expect(match.hardBlockers).toContain("Requires US Citizenship or Active US Security Clearance.");
      expect(match.softSkillGaps).toContain("Rust");
      expect(match.softSkillGaps).toContain("Kubernetes");
      expect(match.matchedSkills).toContain("Python");
    });
  });

  // 3. Deduplication & Canonical URL Normalization
  describe("Deduplication Engine", () => {
    it("should compute identical dedupe hashes for URLs differing only by tracking query parameters", () => {
      const url1 = "https://boards.greenhouse.io/stripe/jobs/1234?utm_source=linkedin&utm_medium=feed";
      const url2 = "https://boards.greenhouse.io/stripe/jobs/1234?utm_source=twitter&ref=careers";

      const hash1 = computeJobDedupeKey(url1, "Stripe", "SWE Intern", "Remote");
      const hash2 = computeJobDedupeKey(url2, "Stripe", "SWE Intern", "Remote");

      expect(hash1).toBe(hash2);
    });

    it("should reject duplicate job listing when added to service", () => {
      const duplicateJob: JobOpeningItem = {
        id: "duplicate-stripe-1",
        canonicalUrl: "https://boards.greenhouse.io/stripe/jobs/swe-intern-infra-2025",
        companyName: "Stripe",
        roleTitle: "Software Engineering Intern - Infrastructure",
        location: "Remote (India)",
        workMode: "REMOTE",
        roleType: "INTERN",
        description: "Duplicate posting",
        postedAt: new Date().toISOString(),
        firstSeenAt: new Date().toISOString(),
        dedupeHash: computeJobDedupeKey(
          "https://boards.greenhouse.io/stripe/jobs/swe-intern-infra-2025",
          "Stripe",
          "Software Engineering Intern - Infrastructure",
          "Remote (India)"
        ),
        status: "ACTIVE",
        isPaid: true,
        sourcePlatform: "GREENHOUSE_PUBLIC",
        requiredSkills: ["TypeScript"],
        preferredSkills: [],
      };

      const result = service.addOrDeduplicateJob(duplicateJob);
      expect(result.added).toBe(false);
      expect(result.reason).toContain("Duplicate job listing detected");
    });
  });

  // 4. Stale and Expired Post Detection
  describe("Expiration & Suspicious Posting Detection", () => {
    it("should flag postings older than 60 days as stale", () => {
      const staleJob: JobOpeningItem = {
        id: "stale-job-1",
        canonicalUrl: "https://careers.example.com/job/old",
        companyName: "Old Corp",
        roleTitle: "Developer",
        location: "Noida",
        workMode: "HYBRID",
        roleType: "INTERN",
        description: "Old post",
        postedAt: new Date(Date.now() - 75 * 24 * 3600 * 1000).toISOString(), // 75 days old
        firstSeenAt: new Date().toISOString(),
        dedupeHash: "stale-hash",
        status: "ACTIVE",
        isPaid: true,
        sourcePlatform: "COMPANY_SITE",
        requiredSkills: ["Python"],
        preferredSkills: [],
      };

      const check = detectSuspiciousOrExpired(staleJob);
      expect(check.isExpired).toBe(true);
      expect(check.reasons[0]).toContain("stale");
    });

    it("should detect suspicious listings requesting upfront fees", () => {
      const scamJob: JobOpeningItem = {
        id: "scam-job-1",
        canonicalUrl: "https://careers.sketchy.com/job/pay",
        companyName: "Sketchy Inc",
        roleTitle: "AI Intern",
        location: "Remote",
        workMode: "REMOTE",
        roleType: "INTERN",
        description: "Immediate hiring. Note: a registration fee of ₹500 is required for background verification.",
        postedAt: new Date().toISOString(),
        firstSeenAt: new Date().toISOString(),
        dedupeHash: "scam-hash",
        status: "ACTIVE",
        isPaid: false,
        sourcePlatform: "COMPANY_SITE",
        requiredSkills: ["Python"],
        preferredSkills: [],
      };

      const check = detectSuspiciousOrExpired(scamJob);
      expect(check.isSuspicious).toBe(true);
      expect(check.reasons[0]).toContain("Suspicious fee requirement");
    });
  });

  // 5. Stage Progression & Audit Tracking
  describe("Application Stage Progression", () => {
    it("should update application stage and record audit event", async () => {
      const update = await service.updateJobStage("demo-user-badri", "job-stripe-infra-2025", "APPLIED");
      expect(update.success).toBe(true);
      expect(update.newStage).toBe("APPLIED");

      // Verify jobs retrieval reflects updated stage
      const jobs = service.getScoredJobs({ stage: "APPLIED" });
      expect(jobs.some((j) => j.job.id === "job-stripe-infra-2025")).toBe(true);
    });
  });
});
