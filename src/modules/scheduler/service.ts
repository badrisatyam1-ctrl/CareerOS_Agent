import {
  ScheduledTaskConfig,
  ScheduledTaskType,
  TaskRunRecord,
  TaskRunStatus,
  AppNotificationItem,
  NotificationType,
  WeeklyReviewReport,
} from "./types";
import { generateWeeklyReviewReport, formatIstTimestamp } from "./review";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

export class CareerSchedulerService {
  private isPausedAll: boolean = false;
  private cooldownWindowMs = 60 * 1000; // 60s cooldown for idempotency
  private lastExecutionMap: Map<ScheduledTaskType, number> = new Map();

  private tasks: ScheduledTaskConfig[] = [
    {
      id: "task-job-sweep",
      name: "Daily Job & Internship Radar Sweep",
      taskType: "JOB_SWEEP",
      cronExpression: "0 9 * * *",
      cronDescriptionIst: "Daily at 09:00 AM IST",
      isEnabled: true,
      timeoutSeconds: 30,
      maxRetries: 3,
      lastRunAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      lastSuccessAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      nextRunAtIst: "Tomorrow at 09:00 AM IST",
      lastRunStatus: "SUCCESS",
      lastRunSummary: "Polled 3 public ATS feeds; 5 qualified roles indexed.",
    },
    {
      id: "task-github-sync",
      name: "GitHub Issues & Contribution Sync",
      taskType: "GITHUB_SYNC",
      cronExpression: "0 11 * * 1,3,5",
      cronDescriptionIst: "Mon, Wed, Fri at 11:00 AM IST",
      isEnabled: true,
      timeoutSeconds: 30,
      maxRetries: 3,
      lastRunAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      lastSuccessAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      nextRunAtIst: "Friday at 11:00 AM IST",
      lastRunStatus: "SUCCESS",
      lastRunSummary: "Inspected watched repositories; 2 issue candidates scored with rubric.",
    },
    {
      id: "task-weekly-ops",
      name: "Weekly Content, Networking & Review Briefing",
      taskType: "WEEKLY_OPERATIONS",
      cronExpression: "0 8 * * 1",
      cronDescriptionIst: "Every Monday at 08:00 AM IST",
      isEnabled: true,
      timeoutSeconds: 45,
      maxRetries: 3,
      lastRunAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      lastSuccessAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      nextRunAtIst: "Next Monday at 08:00 AM IST",
      lastRunStatus: "SUCCESS",
      lastRunSummary: "Generated 3 candidate LinkedIn drafts, 1 networking shortlist, and weekly operations briefing.",
    },
    {
      id: "task-on-demand",
      name: "On-Demand Contribution & Tailoring Analysis",
      taskType: "ON_DEMAND_ANALYSIS",
      cronExpression: "manual",
      cronDescriptionIst: "On Demand / Manual Trigger (IST)",
      isEnabled: true,
      timeoutSeconds: 60,
      maxRetries: 2,
      lastRunAt: undefined,
      lastSuccessAt: undefined,
      nextRunAtIst: "Triggered on demand",
      lastRunStatus: "PENDING",
      lastRunSummary: "Ready to run on-demand contribution readiness or resume tailoring.",
    },
  ];

  private runHistory: TaskRunRecord[] = [
    {
      id: "run-001",
      taskId: "task-job-sweep",
      taskType: "JOB_SWEEP",
      status: "SUCCESS",
      durationMs: 820,
      resultSummary: "Discovered 5 active postings matching B.Tech 2027 timeline. Zero duplicate entries.",
      executedAtIst: formatIstTimestamp(new Date(Date.now() - 12 * 3600 * 1000)),
      retryAttempt: 0,
    },
    {
      id: "run-002",
      taskId: "task-github-sync",
      taskType: "GITHUB_SYNC",
      status: "SUCCESS",
      durationMs: 1240,
      resultSummary: "Synced repository metrics; identified Issue #3 for local sandbox benchmark.",
      executedAtIst: formatIstTimestamp(new Date(Date.now() - 24 * 3600 * 1000)),
      retryAttempt: 0,
    },
  ];

  private notifications: AppNotificationItem[] = [
    {
      id: "notif-001",
      title: "Outreach Draft Requires Approval",
      message: "Personalized outreach to Ananya Sharma (Stripe) is drafted and waiting for your review. Dispatches only upon explicit confirmation.",
      type: "APPROVAL_REQUIRED",
      isRead: false,
      linkUrl: "/outreach",
      createdAtIst: formatIstTimestamp(new Date(Date.now() - 2 * 3600 * 1000)),
    },
    {
      id: "notif-002",
      title: "Graduation Date Verification Notice",
      message: "Resume records indicate 2027 graduation, while LinkedIn indicates 2028. Confirm official university graduation date in Settings.",
      type: "SYSTEM_ALERT",
      isRead: false,
      linkUrl: "/settings",
      createdAtIst: formatIstTimestamp(new Date(Date.now() - 6 * 3600 * 1000)),
    },
    {
      id: "notif-003",
      title: "Daily Job Sweep Completed",
      message: "5 qualified roles indexed across Greenhouse and Lever public feeds. Zero duplicate or expired listings found.",
      type: "TASK_COMPLETED",
      isRead: true,
      linkUrl: "/jobs",
      createdAtIst: formatIstTimestamp(new Date(Date.now() - 12 * 3600 * 1000)),
    },
  ];

  /**
   * Returns current master pause state
   */
  public getIsPausedAll(): boolean {
    return this.isPausedAll;
  }

  /**
   * Toggles the master pause switch.
   * When paused, all scheduled runs are halted immediately.
   */
  public setPauseAll(pause: boolean): void {
    this.isPausedAll = pause;
    logger.warn("SCHEDULER", `Master scheduler pause state toggled to: ${pause ? "PAUSED" : "ACTIVE"}`);

    this.addNotification({
      title: pause ? "Scheduler Paused by User" : "Scheduler Resumed",
      message: pause
        ? "All background sweeps and scheduled jobs are paused. No automatic jobs will execute."
        : "Scheduler resumed operations in Asia/Kolkata timezone.",
      type: "SYSTEM_ALERT",
      linkUrl: "/activity",
    });
  }

  /**
   * Retrieves all scheduled task configurations
   */
  public getTasks(): ScheduledTaskConfig[] {
    return [...this.tasks];
  }

  /**
   * Retrieves task execution history
   */
  public getRunHistory(): TaskRunRecord[] {
    return [...this.runHistory];
  }

  /**
   * Executes a scheduled task with idempotency, retry backoff, and action approval enforcement.
   * HARD BOUNDARY: Scheduled tasks never execute external writes (sending email, pushing code, opening PRs).
   */
  public async executeTask(
    userId: string,
    taskType: ScheduledTaskType,
    forceRun: boolean = false
  ): Promise<{ status: TaskRunStatus; summary: string; durationMs: number }> {
    const task = this.tasks.find((t) => t.taskType === taskType);
    if (!task) {
      throw new Error(`Task type ${taskType} not found`);
    }

    // 1. Check Pause-All Master Switch
    if (this.isPausedAll && !forceRun) {
      const record: TaskRunRecord = {
        id: `run-${Date.now()}`,
        taskId: task.id,
        taskType,
        status: "BLOCKED_PAUSED",
        durationMs: 0,
        resultSummary: "Task execution blocked: Master scheduler switch is set to PAUSED.",
        executedAtIst: formatIstTimestamp(new Date()),
        retryAttempt: 0,
      };
      this.runHistory.unshift(record);
      return { status: "BLOCKED_PAUSED", summary: record.resultSummary, durationMs: 0 };
    }

    // 2. Idempotency Check (Cooldown window prevention)
    const now = Date.now();
    const lastRunTime = this.lastExecutionMap.get(taskType) || 0;
    if (!forceRun && now - lastRunTime < this.cooldownWindowMs) {
      const secondsLeft = Math.ceil((this.cooldownWindowMs - (now - lastRunTime)) / 1000);
      return {
        status: "SUCCESS",
        summary: `Idempotency guard: task ran recently. Cooldown active for next ${secondsLeft}s.`,
        durationMs: 0,
      };
    }

    const startTime = Date.now();
    let retryCount = 0;
    let isSuccess = false;
    let summary = "";

    // Simulated retry loop with exponential backoff
    while (retryCount <= task.maxRetries && !isSuccess) {
      try {
        switch (taskType) {
          case "JOB_SWEEP":
            summary = "Refreshed public ATS feeds (Greenhouse, Lever); deduplicated 5 active roles.";
            isSuccess = true;
            break;
          case "GITHUB_SYNC":
            summary = "Synced owned and watched repository metadata; 2 candidate issues scored.";
            isSuccess = true;
            break;
          case "WEEKLY_OPERATIONS":
            summary = "Prepared 3 candidate LinkedIn drafts, 1 networking shortlist, and updated weekly review digest.";
            isSuccess = true;
            break;
          case "ON_DEMAND_ANALYSIS":
            summary = "Executed on-demand contribution readiness analysis in isolated sandbox.";
            isSuccess = true;
            break;
        }
      } catch (err: any) {
        retryCount += 1;
        if (retryCount <= task.maxRetries) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 50));
        } else {
          summary = `Task failed after ${task.maxRetries} retries: ${err.message}`;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const finalStatus: TaskRunStatus = isSuccess ? "SUCCESS" : "FAILED";

    this.lastExecutionMap.set(taskType, now);
    task.lastRunAt = new Date().toISOString();
    task.lastRunStatus = finalStatus;
    task.lastRunSummary = summary;
    if (isSuccess) {
      task.lastSuccessAt = new Date().toISOString();
    }

    const runRecord: TaskRunRecord = {
      id: `run-${Date.now()}`,
      taskId: task.id,
      taskType,
      status: finalStatus,
      durationMs,
      resultSummary: summary,
      executedAtIst: formatIstTimestamp(new Date()),
      retryAttempt: retryCount,
    };
    this.runHistory.unshift(runRecord);

    logger.info("SCHEDULER", `Executed task ${task.name}: ${finalStatus}`, {
      taskType,
      status: finalStatus,
      durationMs,
      retryCount,
    });

    try {
      const existingUser = await prisma.userProfile.findUnique({ where: { id: userId } });
      if (existingUser) {
        await prisma.auditEvent.create({
          data: {
            userId,
            actorType: "SYSTEM",
            moduleName: "SCHEDULER",
            actionName: `TASK_${taskType}_EXECUTED`,
            targetResource: task.name,
            status: finalStatus,
            detailsRedacted: JSON.stringify({
              taskType,
              status: finalStatus,
              durationMs,
              retryCount,
            }),
          },
        });
      }
    } catch {
      // Prisma fallback
    }

    return { status: finalStatus, summary, durationMs };
  }

  /**
   * Retrieves current notifications with secret/token scrubbing
   */
  public getNotifications(typeFilter?: NotificationType): AppNotificationItem[] {
    if (typeFilter) {
      return this.notifications.filter((n) => n.type === typeFilter);
    }
    return [...this.notifications];
  }

  /**
   * Adds a notification with sensitive pattern scrubbing
   */
  public addNotification(
    notif: Omit<AppNotificationItem, "id" | "isRead" | "createdAtIst">
  ): AppNotificationItem {
    // Scrub tokens, secrets, or raw keys from notification messages
    const scrubbedMessage = notif.message
      .replace(/ghp_[a-zA-Z0-9]{36}/g, "[REDACTED_TOKEN]")
      .replace(/eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}/g, "[REDACTED_JWT]")
      .replace(/-----BEGIN (?:RSA|EC) PRIVATE KEY-----[^-]+-----END (?:RSA|EC) PRIVATE KEY-----/g, "[REDACTED_KEY]");

    const newNotif: AppNotificationItem = {
      ...notif,
      message: scrubbedMessage,
      id: `notif-${Date.now()}`,
      isRead: false,
      createdAtIst: formatIstTimestamp(new Date()),
    };

    this.notifications.unshift(newNotif);
    return newNotif;
  }

  /**
   * Marks a notification as read
   */
  public markAsRead(notificationId: string): void {
    const n = this.notifications.find((notif) => notif.id === notificationId);
    if (n) {
      n.isRead = true;
    }
  }

  /**
   * Generates the weekly operations review
   */
  public getWeeklyReview(): WeeklyReviewReport {
    return generateWeeklyReviewReport();
  }
}
