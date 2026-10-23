import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { evaluateIssueRubric } from "@/modules/github/rubric";
import { GitHubLabService } from "@/modules/github/service";
import { MockGitHubAdapter } from "@/integrations/github";
import { prisma } from "@/lib/db";

describe("GitHub Lab: Issue Rubric Scoring & Repository Intelligence", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Rubric Engine Tests
  describe("evaluateIssueRubric", () => {
    it("should score a high-clarity, testable, skill-aligned open issue with > 85 totalScore", () => {
      const breakdown = evaluateIssueRubric({
        title: "Add batch inference benchmark and latency profiling",
        body: `### Description
We need reproducible latency profiling and batch throughput benchmarks for wafer defect classification models under production load.

### Acceptance Criteria
- Add benchmarks/inference_profile.py
- Measure avg latency per wafer (target < 15ms)
- Output p95 and p99 percentiles
- Automated unit test verifying benchmark reproducibility via pytest`,
        labels: ["enhancement", "good first issue"],
        isOpen: true,
        isAssigned: false,
        repoLanguage: "Python",
        hasContributing: true,
        hasLicense: true,
        hasCi: true,
        updatedAt: new Date().toISOString(),
        verifiedSkills: ["Python", "PyTorch"],
      });

      expect(breakdown.totalScore).toBeGreaterThanOrEqual(85);
      expect(breakdown.skillMatchScore).toBe(25);
      expect(breakdown.clarityScore).toBe(20);
      expect(breakdown.uncertainty).toBe("LOW");
      expect(breakdown.warnings).toHaveLength(0);
      expect(breakdown.rationale).toContain("Python");
    });

    it("should flag uncertainty and penalize an ambiguous 1-line issue", () => {
      const breakdown = evaluateIssueRubric({
        title: "Fix bug",
        body: "doesn't work",
        labels: [],
        isOpen: true,
        isAssigned: false,
        repoLanguage: "Python",
        hasContributing: false,
        hasLicense: true,
        hasCi: false,
        updatedAt: new Date().toISOString(),
        verifiedSkills: ["Python"],
      });

      expect(breakdown.clarityScore).toBeLessThan(10);
      expect(breakdown.uncertainty).toBe("HIGH");
      expect(breakdown.warnings.some((w) => w.includes("brief") || w.includes("ambiguity"))).toBe(true);
    });

    it("should warn if an issue is already assigned to another contributor", () => {
      const breakdown = evaluateIssueRubric({
        title: "Optimize throughput in PyTorch",
        body: "Detailed reproduction steps and test plan with pytest.",
        labels: ["bug"],
        isOpen: true,
        isAssigned: true, // Already assigned
        repoLanguage: "Python",
        hasContributing: true,
        hasLicense: true,
        hasCi: true,
        updatedAt: new Date().toISOString(),
        verifiedSkills: ["Python"],
      });

      expect(breakdown.warnings.some((w) => w.includes("already assigned"))).toBe(true);
    });
  });

  // 2. GitHubLabService Tests
  describe("GitHubLabService", () => {
    let service: GitHubLabService;
    let mockAdapter: MockGitHubAdapter;

    beforeEach(() => {
      mockAdapter = new MockGitHubAdapter();
      service = new GitHubLabService(mockAdapter);
    });

    it("should categorize repositories into OWNED, FORK, and STARRED", async () => {
      const repos = await service.getCategorizedRepositories("badrisatyam1-ctrl");

      expect(repos.length).toBeGreaterThanOrEqual(4);
      const owned = repos.filter((r) => r.category === "OWNED");
      const forks = repos.filter((r) => r.category === "FORK");
      const starred = repos.filter((r) => r.category === "STARRED");

      expect(owned.length).toBeGreaterThanOrEqual(2);
      expect(forks.length).toBeGreaterThanOrEqual(1);
      expect(starred.length).toBeGreaterThanOrEqual(1);
    });

    it("should filter repositories by language and category", async () => {
      const pythonRepos = await service.getCategorizedRepositories("badrisatyam1-ctrl", {
        language: "Python",
      });

      expect(pythonRepos.every((r) => r.primaryLanguage.toLowerCase() === "python")).toBe(true);

      const forkRepos = await service.getCategorizedRepositories("badrisatyam1-ctrl", {
        isFork: true,
      });

      expect(forkRepos.every((r) => r.isFork)).toBe(true);
    });

    it("should discover and score issues descending by suitability", async () => {
      const candidates = await service.discoverAndScoreIssues("badrisatyam1-ctrl/wafer-defect-classification");

      expect(candidates.length).toBeGreaterThanOrEqual(2);
      expect(candidates[0].rubric.totalScore).toBeGreaterThanOrEqual(candidates[1].rubric.totalScore);
      expect(candidates[0].issueNumber).toBeGreaterThan(0);
      expect(candidates[0].recommendedNextStep).toBeDefined();
    });

    it("should fetch trending repositories by language with explainable match reason", async () => {
      const trending = await service.getTrending("Python", "daily");

      expect(trending.length).toBeGreaterThanOrEqual(1);
      expect(trending[0].language).toBe("Python");
      expect(trending[0].matchReason).toContain("deep learning");
    });

    it("should promote an issue candidate to Contribution Workbench and database", async () => {
      const candidates = await service.discoverAndScoreIssues("badrisatyam1-ctrl/wafer-defect-classification");
      const topCandidate = candidates[0];

      await service.promoteToWorkbench("demo-user-badri", topCandidate);

      const savedCandidate = await prisma.issueCandidate.findFirst({
        where: { issueUrl: topCandidate.issueUrl },
      });

      expect(savedCandidate).toBeDefined();
      expect(savedCandidate?.status).toBe("ACCEPTED");

      const task = await prisma.contributionTask.findFirst({
        where: { issueCandidateId: savedCandidate?.id },
        orderBy: { createdAt: "desc" },
      });

      expect(task).toBeDefined();
      expect(task?.status).toBe("PLANNED");
    });
  });
});
