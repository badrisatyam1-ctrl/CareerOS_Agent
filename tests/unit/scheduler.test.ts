import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { CareerSchedulerService } from "@/modules/scheduler/service";
import { formatIstTimestamp, generateWeeklyReviewReport } from "@/modules/scheduler/review";
import { prisma } from "@/lib/db";

describe("CareerOS Scheduler & Notification Center", () => {
  let scheduler: CareerSchedulerService;

  beforeEach(() => {
    scheduler = new CareerSchedulerService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Timezone Boundaries (Asia/Kolkata UTC+5:30)
  describe("Timezone Boundaries (Asia/Kolkata)", () => {
    it("should format timestamps in Asia/Kolkata timezone", () => {
      // Midnight UTC (2026-10-22 00:00:00 UTC) is 05:30:00 AM IST on the same day
      const utcMidnight = new Date("2026-10-22T00:00:00.000Z");
      const formatted = formatIstTimestamp(utcMidnight);
      
      expect(formatted).toContain("2026");
      expect(formatted).toContain("05:30:00");
      expect(formatted.toLowerCase()).toContain("am");
    });

    it("should correctly handle date boundary transitions across midnight UTC", () => {
      // 2026-10-21 20:00:00 UTC is 2026-10-22 01:30:00 AM IST (Next day in India)
      const lateUtc = new Date("2026-10-21T20:00:00.000Z");
      const formatted = formatIstTimestamp(lateUtc);

      expect(formatted).toContain("22");
      expect(formatted).toContain("01:30:00");
      expect(formatted.toLowerCase()).toContain("am");
    });

    it("should configure all task schedules in Asia/Kolkata timezone with explicit IST descriptions", () => {
      const tasks = scheduler.getTasks();
      expect(tasks.length).toBeGreaterThanOrEqual(3);

      for (const task of tasks) {
        expect(task.cronDescriptionIst).toContain("IST");
        expect(task.cronExpression).toBeTruthy();
        expect(task.isEnabled).toBe(true);
      }

      // Check specific suggested defaults
      const jobSweep = tasks.find((t) => t.taskType === "JOB_SWEEP");
      expect(jobSweep?.cronDescriptionIst).toBe("Daily at 09:00 AM IST");

      const githubSync = tasks.find((t) => t.taskType === "GITHUB_SYNC");
      expect(githubSync?.cronDescriptionIst).toBe("Mon, Wed, Fri at 11:00 AM IST");

      const weeklyOps = tasks.find((t) => t.taskType === "WEEKLY_OPERATIONS");
      expect(weeklyOps?.cronDescriptionIst).toBe("Every Monday at 08:00 AM IST");
    });
  });

  // 2. Pause-All Master Switch
  describe("Pause-All Master Switch", () => {
    it("should block automated task execution when master switch is paused", async () => {
      expect(scheduler.getIsPausedAll()).toBe(false);

      scheduler.setPauseAll(true);
      expect(scheduler.getIsPausedAll()).toBe(true);

      const result = await scheduler.executeTask("user-badri-001", "JOB_SWEEP", false);
      expect(result.status).toBe("BLOCKED_PAUSED");
      expect(result.summary).toContain("Master scheduler switch is set to PAUSED");

      // Verify notification logged
      const notifs = scheduler.getNotifications();
      expect(notifs[0].title).toBe("Scheduler Paused by User");
      expect(notifs[0].type).toBe("SYSTEM_ALERT");
    });

    it("should resume task execution when master switch is resumed", async () => {
      scheduler.setPauseAll(true);
      scheduler.setPauseAll(false);
      expect(scheduler.getIsPausedAll()).toBe(false);

      const result = await scheduler.executeTask("user-badri-001", "JOB_SWEEP", false);
      expect(result.status).toBe("SUCCESS");
      expect(result.summary).toContain("Refreshed public ATS feeds");
    });
  });

  // 3. Idempotency & Duplicate Run Prevention
  describe("Idempotency & Duplicate Run Prevention", () => {
    it("should prevent duplicate runs within the 60-second cooldown window", async () => {
      // First run succeeds
      const firstRun = await scheduler.executeTask("user-badri-001", "GITHUB_SYNC", false);
      expect(firstRun.status).toBe("SUCCESS");

      // Immediate second run should be caught by idempotency guard
      const duplicateRun = await scheduler.executeTask("user-badri-001", "GITHUB_SYNC", false);
      expect(duplicateRun.status).toBe("SUCCESS");
      expect(duplicateRun.summary).toContain("Idempotency guard: task ran recently");
      expect(duplicateRun.durationMs).toBe(0);
    });

    it("should allow manual force run to bypass the cooldown window", async () => {
      await scheduler.executeTask("user-badri-001", "GITHUB_SYNC", false);

      // Force run bypasses cooldown
      const forcedRun = await scheduler.executeTask("user-badri-001", "GITHUB_SYNC", true);
      expect(forcedRun.status).toBe("SUCCESS");
      expect(forcedRun.summary).toContain("Synced owned and watched repository metadata");
    });
  });

  // 4. Retries & Run History
  describe("Retries & Run History", () => {
    it("should record execution duration, status, and retry attempts in history", async () => {
      const initialHistoryLength = scheduler.getRunHistory().length;
      await scheduler.executeTask("user-badri-001", "ON_DEMAND_ANALYSIS", true);

      const history = scheduler.getRunHistory();
      expect(history.length).toBe(initialHistoryLength + 1);

      const latestRun = history[0];
      expect(latestRun.taskType).toBe("ON_DEMAND_ANALYSIS");
      expect(latestRun.status).toBe("SUCCESS");
      expect(latestRun.durationMs).toBeGreaterThanOrEqual(0);
      expect(latestRun.executedAtIst).toContain("2026");
      expect(latestRun.retryAttempt).toBe(0);
    });

    it("should update lastRunAt, lastSuccessAt, and lastRunStatus on task configuration", async () => {
      const taskBefore = scheduler.getTasks().find((t) => t.taskType === "WEEKLY_OPERATIONS");
      expect(taskBefore).toBeDefined();

      await scheduler.executeTask("user-badri-001", "WEEKLY_OPERATIONS", true);

      const taskAfter = scheduler.getTasks().find((t) => t.taskType === "WEEKLY_OPERATIONS");
      expect(taskAfter?.lastRunStatus).toBe("SUCCESS");
      expect(taskAfter?.lastRunAt).toBeTruthy();
      expect(taskAfter?.lastSuccessAt).toBeTruthy();
      expect(taskAfter?.lastRunSummary).toContain("Prepared 3 candidate LinkedIn drafts");
    });
  });

  // 5. Action-Approval Enforcement (External Actions Hard Rule)
  describe("Action-Approval Enforcement", () => {
    it("should ensure scheduler operations only draft or refresh data, never bypass external action approvals", async () => {
      // Scheduler tasks never perform remote writes, un-approved email dispatches, or PR creation
      const result = await scheduler.executeTask("user-badri-001", "WEEKLY_OPERATIONS", true);
      expect(result.status).toBe("SUCCESS");

      // Verify that no unapproved email was sent
      const review = scheduler.getWeeklyReview();
      expect(review.pipelineCounts.outreach.executed).toBe(1); // 1 approved email from Phase 8
      expect(review.pipelineCounts.jobs.executed).toBe(0);     // 0 applications sent without manual user action
    });
  });

  // 6. Notification Secret & Token Scrubbing
  describe("Notification Secret Scrubbing", () => {
    it("should automatically redact GitHub PATs from notifications", () => {
      const sensitivePat = "ghp_123456789012345678901234567890123456";
      const notif = scheduler.addNotification({
        title: "Test Alert",
        message: `Token detected: ${sensitivePat} in sync output.`,
        type: "SYSTEM_ALERT",
      });

      expect(notif.message).not.toContain(sensitivePat);
      expect(notif.message).toContain("[REDACTED_TOKEN]");
    });

    it("should automatically redact JWTs and private keys from notifications", () => {
      const sensitiveJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0";
      const notif = scheduler.addNotification({
        title: "Auth Warning",
        message: `JWT session payload: ${sensitiveJwt}`,
        type: "SYSTEM_ALERT",
      });

      expect(notif.message).not.toContain(sensitiveJwt);
      expect(notif.message).toContain("[REDACTED_JWT]");
    });

    it("should allow marking notifications as read", () => {
      const unreadBefore = scheduler.getNotifications().filter((n) => !n.isRead).length;
      expect(unreadBefore).toBeGreaterThan(0);

      const target = scheduler.getNotifications()[0];
      scheduler.markAsRead(target.id);

      const updated = scheduler.getNotifications().find((n) => n.id === target.id);
      expect(updated?.isRead).toBe(true);
    });
  });

  // 7. Weekly Operations Review & Honest Status Distinction
  describe("Weekly Operations Review: Meaningful Metrics & Honest Status", () => {
    it("should strictly distinguish suggested, drafted, approved, executed, and verified outcomes", () => {
      const review = generateWeeklyReviewReport();

      // Jobs Pipeline
      expect(review.pipelineCounts.jobs.suggested).toBe(5);
      expect(review.pipelineCounts.jobs.drafted).toBe(1);
      expect(review.pipelineCounts.jobs.approved).toBe(1);
      expect(review.pipelineCounts.jobs.executed).toBe(0); // Never count unsent draft as sent application!
      expect(review.pipelineCounts.jobs.verifiedOutcome).toBe(0);

      // GitHub Pipeline
      expect(review.pipelineCounts.github.suggested).toBe(2);
      expect(review.pipelineCounts.github.drafted).toBe(1);
      expect(review.pipelineCounts.github.approved).toBe(2);
      expect(review.pipelineCounts.github.executed).toBe(1);
      expect(review.pipelineCounts.github.verifiedOutcome).toBe(1); // Only actual merged PR #4 is verified!

      // Recruiter Outreach Pipeline
      expect(review.pipelineCounts.outreach.suggested).toBe(4);
      expect(review.pipelineCounts.outreach.drafted).toBe(2);
      expect(review.pipelineCounts.outreach.approved).toBe(1);
      expect(review.pipelineCounts.outreach.executed).toBe(1);
      expect(review.pipelineCounts.outreach.verifiedOutcome).toBe(0);
    });

    it("should explain active bottlenecks and stale data items honestly", () => {
      const review = generateWeeklyReviewReport();

      expect(review.keyWins.length).toBeGreaterThanOrEqual(3);
      expect(review.activeBottlenecks.length).toBeGreaterThanOrEqual(2);
      expect(review.staleItemsExplanation.length).toBeGreaterThanOrEqual(2);

      // Check specific honest explanations
      const hasQualcommStale = review.staleItemsExplanation.some((s) => s.includes("Qualcomm"));
      expect(hasQualcommStale).toBe(true);

      const hasGraduationMismatch = review.activeBottlenecks.some((b) => b.includes("Graduation year discrepancy"));
      expect(hasGraduationMismatch).toBe(true);
    });
  });
});
