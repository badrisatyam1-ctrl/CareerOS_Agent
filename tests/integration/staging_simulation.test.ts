import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { CareerEvidenceVaultService } from "@/modules/vault/service";
import { GitHubLabService } from "@/modules/github/service";
import { MockGitHubAdapter } from "@/integrations/github";
import { ContributionWorkbenchService } from "@/modules/workbench/service";
import { LinkedInStudioService } from "@/modules/linkedin/service";
import { CareerNetworkingService } from "@/modules/networking/service";
import { JobDiscoveryService } from "@/modules/jobs/service";
import { ResumeTailoringService } from "@/modules/resume/service";
import { GmailOutreachService } from "@/modules/outreach/service";
import { MockGmailAdapter } from "@/integrations/gmail";
import { CareerSchedulerService } from "@/modules/scheduler/service";
import { generateWeeklyReviewReport } from "@/modules/scheduler/review";
import { prisma } from "@/lib/db";
import { computeHash } from "@/lib/crypto";

/**
 * Phase 12: End-to-End Staging Simulation
 * Demonstrates the complete CareerOS workflow in mock/demo mode.
 * HARD RULE: Zero real external writes (no live emails, no live posts, no live git pushes, no live PRs).
 */
describe("Phase 12: Complete End-to-End Staging Simulation", () => {
  let vaultService: CareerEvidenceVaultService;
  let githubAdapter: MockGitHubAdapter;
  let githubLabService: GitHubLabService;
  let workbenchService: ContributionWorkbenchService;
  let linkedinService: LinkedInStudioService;
  let networkingService: CareerNetworkingService;
  let jobService: JobDiscoveryService;
  let resumeService: ResumeTailoringService;
  let gmailAdapter: MockGmailAdapter;
  let outreachService: GmailOutreachService;
  let schedulerService: CareerSchedulerService;

  beforeEach(() => {
    vaultService = new CareerEvidenceVaultService();
    githubAdapter = new MockGitHubAdapter();
    githubLabService = new GitHubLabService(githubAdapter);
    workbenchService = new ContributionWorkbenchService(githubAdapter);
    linkedinService = new LinkedInStudioService();
    networkingService = new CareerNetworkingService();
    jobService = new JobDiscoveryService();
    resumeService = new ResumeTailoringService();
    gmailAdapter = new MockGmailAdapter();
    outreachService = new GmailOutreachService(gmailAdapter);
    schedulerService = new CareerSchedulerService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Step 1: Configure Career Preferences & Resolve Graduation-Date Discrepancy
  describe("Step 1: Career Preferences & Graduation Discrepancy Resolution", () => {
    it("should resolve the 2027 vs 2028 graduation discrepancy and store confirmed preferences", () => {
      const preferences = vaultService.getPreferences(true);
      expect(preferences.targetRoles.length).toBeGreaterThan(0);
      expect(preferences.targetRoles[0]).toContain("Software Engineering Intern");

      // Verify that confirmed education fact in vault records 2028 graduation
      const eduFact = vaultService.getAllFacts().find((f) => f.factType === "EDUCATION");
      expect(eduFact).toBeDefined();
      expect(eduFact?.claimSummary).toContain("graduating in 2028");
      expect(eduFact?.tags).toContain("2028");
    });
  });

  // Step 2: Connect Mock GitHub & Inspect Repositories and Issues
  describe("Step 2: Mock GitHub Connection & Repository Intelligence", () => {
    it("should discover categorized repositories, trending repositories, and score issues", async () => {
      const allRepos = await githubLabService.getCategorizedRepositories("badrisatyam1-ctrl");
      const owned = allRepos.filter((r) => r.category === "OWNED");
      expect(owned.length).toBeGreaterThan(0);

      // Verify WaferOS repository exists in owned repos
      const waferRepo = owned.find((r) => r.name === "wafer-defect-classification");
      expect(waferRepo).toBeDefined();
      expect(waferRepo?.primaryLanguage).toBe("Python");

      // Verify trending repositories retrieval
      const trending = await githubLabService.getTrending("Python", "weekly");
      expect(trending.length).toBeGreaterThan(0);
      expect(trending[0].matchReason).toBeTruthy();

      // Retrieve issue candidates and verify rubric scoring
      const candidates = await githubLabService.discoverAndScoreIssues("badrisatyam1-ctrl/wafer-defect-classification");
      expect(candidates.length).toBeGreaterThan(0);

      const topCandidate = candidates[0];
      expect(topCandidate.rubric.totalScore).toBeGreaterThanOrEqual(75);
      expect(topCandidate.rubric.rationale).toBeTruthy();
      expect(topCandidate.recommendedNextStep).toBeDefined();
    });
  });

  // Step 3: Workbench Issue Plan, Isolated Tests, Secret Scan & Blocked PR Gate
  describe("Step 3: Workbench Workflow & Dual Approval Gate Enforcement", () => {
    it("should inspect repository, prepare plan, run sandbox tests, scan diff, and enforce approval gate before PR", async () => {
      const repoFullName = "badrisatyam1-ctrl/wafer-defect-classification";
      const issueNumber = 3;

      // 1. Pre-coding inspection
      const inspection = await workbenchService.inspectRepository(repoFullName, issueNumber);
      expect(inspection.isWelcome).toBe(true);
      expect(inspection.hasContributingGuide).toBe(true);
      expect(inspection.licenseSpdx).toBe("MIT");

      // 2. Formulate structured contribution plan
      const plan = workbenchService.createContributionPlan(issueNumber, "Batch inference latency benchmark", repoFullName);
      expect(plan.featureBranchName).toBe("feat/issue-3-batch-benchmark");
      expect(plan.targetBranch).toBe("main");
      expect(plan.acceptanceCriteria.length).toBeGreaterThanOrEqual(3);

      // 3. Run targeted tests in isolated sandbox
      const testResult = await workbenchService.runSandboxTests("task-wafer-003", "pytest tests/test_benchmark.py -v");
      expect(testResult.exitCode).toBe(0);
      expect(testResult.isSuccess).toBe(true);
      expect(testResult.stdout).toContain("passed");

      // 4. Prepare patch and scan for secrets
      const cleanDiff = `diff --git a/benchmarks/inference.py b/benchmarks/inference.py
+import torch
+def benchmark_batch_inference(): pass`;
      const patch = workbenchService.preparePatch(cleanDiff, plan.featureBranchName);
      expect(patch.isValid).toBe(true);
      expect(patch.diffHash).toBeTruthy();

      // 5. Verify PR submission is BLOCKED without approval
      const unapprovedPr = await workbenchService.executeApprovedOpenPr(
        "unapproved-token",
        repoFullName,
        "Feat: Latency Benchmark",
        "Benchmark description",
        patch.diffHash
      );
      expect(unapprovedPr.success).toBe(false);
      expect(unapprovedPr.error).toContain("Approval record not found");
    });
  });

  // Step 4: LinkedIn 3-Draft Generation, Tone Learning & Manual Handoff Default
  describe("Step 4: LinkedIn Content Plan, Evidence Citations & Manual Handoff", () => {
    it("should generate 3 evidence-backed candidate drafts and enforce manual handoff posture", () => {
      const plan = linkedinService.generateWeeklyPlan("user-badri-001");
      expect(plan.candidates.length).toBe(3);

      // Candidate 1: Build Log
      const buildLog = plan.candidates.find((c) => c.theme === "BUILD_LOG");
      expect(buildLog).toBeDefined();
      expect(buildLog?.evidenceSources.length).toBeGreaterThan(0);
      expect(buildLog?.reviewChecklist.evidenceVerified).toBe(true);
      expect(buildLog?.reviewChecklist.toneModest).toBe(true);
      expect(buildLog?.reviewChecklist.noSpamHooks).toBe(true);

      // Verify manual handoff default (No automated bot posting!)
      const handoff = linkedinService.getHandoffPayload(buildLog!);
      expect(handoff.targetFeedUrl).toContain("linkedin.com/feed");
      expect(handoff.clipboardText).toBe(buildLog?.content);

      // Networking shortlist verification
      const leads = networkingService.getRankedLeads();
      expect(leads.length).toBeGreaterThanOrEqual(3);
      for (const lead of leads) {
        expect(lead.provenanceUrl).toBeTruthy();
        expect(["IDENTIFIED", "DRAFTED"]).toContain(lead.connectionState);
      }
    });
  });

  // Step 5: Truthful Job Matching, Resume Tailoring & Gmail Draft Preview
  describe("Step 5: Job Discovery, Evidence-Based Resume Tailoring & Gmail Draft Preview", () => {
    it("should match jobs truthfully, generate zero-fabrication resume, and prepare Gmail draft with attachment", () => {
      // 1. Discover jobs matching 2028 graduation profile
      const scoredJobs = jobService.getScoredJobs({}, 2028);
      const stripeJob = scoredJobs.find((j) => j.job.companyName === "Stripe");
      expect(stripeJob).toBeDefined();
      expect(stripeJob?.match.eligibilityStatus).toBe("ELIGIBLE");
      expect(stripeJob?.match.overallFitScore).toBeGreaterThanOrEqual(70);

      // 2. Tailor resume without inventing metrics
      const resumeVariant = resumeService.tailorResumeForJob(stripeJob!.job);
      expect(resumeVariant.isBaseImmutable).toBe(true);
      expect(resumeVariant.unverifiedClaimsAttempted).toHaveLength(0);
      expect(resumeVariant.changedBullets.length).toBeGreaterThan(0);
      expect(resumeVariant.markdownContent).toContain("Badri Vishal Pandey");

      // 3. Inspect Gmail draft with attachment preview
      const drafts = outreachService.getDrafts();
      const stripeDraft = drafts.find((d) => d.jobId === stripeJob?.job.id);
      expect(stripeDraft).toBeDefined();
      expect(stripeDraft?.recipient.email).toContain("stripe.example.com");
      expect(stripeDraft?.recipient.provenanceUrl).toBeTruthy();
      expect(stripeDraft?.attachment).toBeDefined();
      expect(stripeDraft?.attachment?.fileName).toBe("Badri_Vishal_Pandey_Resume_2028.pdf");
      expect(stripeDraft?.status).toBe("NEEDS_REVIEW");
    });
  });

  // Step 6: Recruiter Outreach Delivery Guards & Confirmation
  describe("Step 6: Gmail Delivery Safeguards, Do-Not-Contact & Idempotency", () => {
    it("should block dispatch without approval, enforce opt-out, and dispatch only upon confirmation", async () => {
      const drafts = outreachService.getDrafts();
      const draft = drafts[0];

      // 1. Unapproved dispatch fails
      const unapprovedSend = await outreachService.sendApprovedOutreach(
        "user-badri-001",
        draft.id,
        "missing-approval",
        "mismatched-hash"
      );
      expect(unapprovedSend.success).toBe(false);

      // 2. Do-Not-Contact guard
      outreachService.setDoNotContact(draft.recipient.email, "User opted out");
      const blockedSend = await outreachService.sendApprovedOutreach(
        "user-badri-001",
        draft.id,
        "fake-approval",
        computeHash(draft.bodyText)
      );
      expect(blockedSend.success).toBe(false);
      expect(blockedSend.error).toContain("DO_NOT_CONTACT");

      // 3. Pause-All master switch blocks scheduler tasks
      schedulerService.setPauseAll(true);
      const pausedRun = await schedulerService.executeTask("user-badri-001", "JOB_SWEEP", false);
      expect(pausedRun.status).toBe("BLOCKED_PAUSED");
      schedulerService.setPauseAll(false); // Restore
    });
  });

  // Step 7: Weekly Review Briefing & Honest Status Distinction
  describe("Step 7: Weekly Operations Briefing with Honest Pipeline Metrics", () => {
    it("should report truthful pipeline counts without counting drafts as sent applications or contributions", () => {
      const review = generateWeeklyReviewReport();

      // Jobs: 1 drafted resume does not equal sent application
      expect(review.pipelineCounts.jobs.suggested).toBe(5);
      expect(review.pipelineCounts.jobs.drafted).toBe(1);
      expect(review.pipelineCounts.jobs.approved).toBe(1);
      expect(review.pipelineCounts.jobs.executed).toBe(0); // 0 auto-applications!
      expect(review.pipelineCounts.jobs.verifiedOutcome).toBe(0);

      // GitHub: only actual merged PR #4 is verified outcome
      expect(review.pipelineCounts.github.suggested).toBe(2);
      expect(review.pipelineCounts.github.drafted).toBe(1);
      expect(review.pipelineCounts.github.executed).toBe(1);
      expect(review.pipelineCounts.github.verifiedOutcome).toBe(1); // Merged PR #4 on WaferOS

      // Recruiter Outreach: 1 sent email via Gmail
      expect(review.pipelineCounts.outreach.suggested).toBe(4);
      expect(review.pipelineCounts.outreach.drafted).toBe(2);
      expect(review.pipelineCounts.outreach.executed).toBe(1);
      expect(review.pipelineCounts.outreach.verifiedOutcome).toBe(0);

      // Explanations of bottlenecks and stale items
      expect(review.activeBottlenecks.length).toBeGreaterThan(0);
      expect(review.staleItemsExplanation.length).toBeGreaterThan(0);
    });
  });
});
