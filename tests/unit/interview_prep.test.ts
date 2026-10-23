import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { InterviewPrepService } from "@/modules/interview/service";
import { JobOpeningItem } from "@/modules/jobs/types";
import { prisma } from "@/lib/db";

describe("Interview Preparation: Skill Matrix, Study Plan & Verified STAR Stories", () => {
  let service: InterviewPrepService;

  beforeEach(() => {
    service = new InterviewPrepService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const stripeJob: JobOpeningItem = {
    id: "job-stripe-infra-test",
    canonicalUrl: "https://boards.greenhouse.io/stripe/jobs/swe-intern-infra-2025",
    companyName: "Stripe",
    roleTitle: "Software Engineering Intern - Infrastructure",
    location: "Remote (India)",
    workMode: "REMOTE",
    roleType: "INTERN",
    description: "Distributed systems, concurrency, Go, TypeScript, SQL, and database transaction boundaries.",
    postedAt: new Date().toISOString(),
    firstSeenAt: new Date().toISOString(),
    dedupeHash: "hash-stripe-test",
    status: "ACTIVE",
    isPaid: true,
    sourcePlatform: "GREENHOUSE_PUBLIC",
    requiredSkills: ["TypeScript", "SQL", "Git", "REST APIs", "DSA"],
    preferredSkills: ["Go", "Redis", "Distributed Systems"],
  };

  // 1. Skill Matrix Derivation
  describe("Derived Skill Matrix", () => {
    it("should classify skills into DEMONSTRATED_BY_PROJECT, PARTIALLY_DEMONSTRATED, and MISSING_UNKNOWN", () => {
      const matrix = service.deriveSkillMatrix(stripeJob);
      expect(matrix.entries.length).toBeGreaterThanOrEqual(8);

      // TypeScript & SQL backed by TravelBooking
      const tsEntry = matrix.entries.find((e) => e.name === "TypeScript");
      expect(tsEntry?.level).toBe("DEMONSTRATED_BY_PROJECT");
      expect(tsEntry?.evidenceRef).toBe("TravelBooking");

      // DSA backed by LeetCode
      const dsaEntry = matrix.entries.find((e) => e.name === "DSA");
      expect(dsaEntry?.level).toBe("DEMONSTRATED_BY_PROJECT");
      expect(dsaEntry?.evidenceRef).toContain("LeetCode");

      // Go is preferred but absent from project repositories -> MISSING_UNKNOWN
      const goEntry = matrix.entries.find((e) => e.name === "Go");
      expect(goEntry?.level).toBe("MISSING_UNKNOWN");
    });

    it("should report accurate summary metrics without treating keywords as deep mastery", () => {
      const matrix = service.deriveSkillMatrix(stripeJob);
      expect(matrix.summary.requiredCount).toBe(5);
      expect(matrix.summary.demonstratedCount).toBeGreaterThan(0);
      expect(matrix.summary.gapCount).toBeGreaterThan(0);
    });
  });

  // 2. Structured Study Plan
  describe("Structured 4-Week Study Plan", () => {
    it("should generate 4 structured weekly milestones covering concurrency, ML, telemetry, and mock loops", () => {
      const plan = service.getStudyPlan(stripeJob.id);
      expect(plan).toHaveLength(4);
      expect(plan[0].weekNumber).toBe(1);
      expect(plan[0].focusArea).toContain("Distributed Systems");
      expect(plan[1].focusArea).toContain("Machine Learning");
      expect(plan[2].focusArea).toContain("Data Pipelines");
      expect(plan[3].focusArea).toContain("Full-Loop Preparation");
    });
  });

  // 3. Technical & Project Questions
  describe("Technical & Architectural Questions", () => {
    it("should provide project-specific technical questions directly probing real architecture decisions", () => {
      const questions = service.getInterviewQuestions(stripeJob.id);
      expect(questions.length).toBeGreaterThanOrEqual(4);

      const sysQ = questions.find((q) => q.contextProject === "TravelBooking");
      expect(sysQ?.prompt).toContain("prevent double-booking race conditions");
      expect(sysQ?.keyPointsToHit).toContain("Explain Redis TTL lease locks (120s expiration) and automatic key release upon checkout failure.");

      const mlQ = questions.find((q) => q.contextProject === "WaferOS");
      expect(mlQ?.prompt).toContain("90%+ of dies are defect-free");
      expect(mlQ?.keyPointsToHit).toContain("Compare Focal Loss vs Class-Weighted Cross Entropy loss penalties.");
    });
  });

  // 4. STAR Stories
  describe("Verified STAR Stories", () => {
    it("should ground every STAR story strictly in verified project artifacts", () => {
      const stories = service.getStarStories();
      expect(stories.length).toBeGreaterThanOrEqual(3);

      for (const story of stories) {
        expect(story.situation).toBeTruthy();
        expect(story.task).toBeTruthy();
        expect(story.action).toBeTruthy();
        expect(story.result).toBeTruthy();
        expect(story.verifiedEvidenceRef).toMatch(/^(GITHUB_REPO|CREDENTIAL_URL):/);
      }
    });
  });

  // 5. Practice Session Logging
  describe("Practice Session Logging", () => {
    it("should record practice sessions and maintain history", async () => {
      const initialCount = service.getPracticeSessions().length;

      const session = await service.recordPracticeSession("demo-user-badri", {
        skillName: "Redis TTL Lease Lock Implementation",
        sessionType: "SYSTEM_DESIGN",
        notes: "Implemented atomic lease acquisition using SET NX EX in TypeScript.",
        durationMinutes: 45,
        confidenceRating: 4,
      });

      expect(session.id).toBeDefined();
      expect(session.confidenceRating).toBe(4);
      expect(service.getPracticeSessions().length).toBe(initialCount + 1);
    });
  });
});
