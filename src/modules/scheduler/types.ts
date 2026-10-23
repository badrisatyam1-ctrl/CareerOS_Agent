/**
 * Scheduler, Notifications & Weekly Review Domain Types
 */

export type ScheduledTaskType =
  | "JOB_SWEEP"
  | "GITHUB_SYNC"
  | "WEEKLY_OPERATIONS"
  | "ON_DEMAND_ANALYSIS";

export type TaskRunStatus = "SUCCESS" | "FAILED" | "TIMEOUT" | "BLOCKED_PAUSED" | "RUNNING" | "PENDING";

export type NotificationType =
  | "APPROVAL_REQUIRED"
  | "TASK_COMPLETED"
  | "SYSTEM_ALERT"
  | "SECURITY_NOTICE";

export interface ScheduledTaskConfig {
  id: string;
  name: string;
  taskType: ScheduledTaskType;
  cronExpression: string;
  cronDescriptionIst: string; // e.g. "Daily at 09:00 AM IST"
  isEnabled: boolean;
  timeoutSeconds: number;
  maxRetries: number;
  lastRunAt?: string;
  lastSuccessAt?: string;
  nextRunAtIst: string;
  lastRunStatus?: TaskRunStatus;
  lastRunSummary?: string;
}

export interface TaskRunRecord {
  id: string;
  taskId: string;
  taskType: ScheduledTaskType;
  status: TaskRunStatus;
  durationMs: number;
  resultSummary: string;
  executedAtIst: string;
  retryAttempt: number;
}

export interface AppNotificationItem {
  id: string;
  title: string;
  message: string; // Must be scrubbed of tokens, full resumes, or private emails
  type: NotificationType;
  isRead: boolean;
  linkUrl?: string;
  createdAtIst: string;
}

export interface VerifiedPipelineCounts {
  suggested: number;      // Discovered/ranked items
  drafted: number;        // Prepared locally
  approved: number;       // Explicitly human approved
  executed: number;       // Dispatched/run in sandbox
  verifiedOutcome: number;// Merged PRs, confirmed responses, verified achievements
}

export interface WeeklyReviewReport {
  periodStart: string;
  periodEnd: string;
  timezone: "Asia/Kolkata";
  executiveSummary: string;
  pipelineCounts: {
    jobs: VerifiedPipelineCounts;
    github: VerifiedPipelineCounts;
    outreach: VerifiedPipelineCounts;
    content: VerifiedPipelineCounts;
  };
  keyWins: string[];
  activeBottlenecks: string[];
  upcomingPriorities: string[];
  staleItemsExplanation: string[];
  generatedAtIst: string;
}
