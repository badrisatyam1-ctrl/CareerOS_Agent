"use client";

import { useState } from "react";
import {
  Activity,
  Calendar,
  Clock,
  Play,
  Pause,
  RotateCw,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Check,
  Filter,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  GitPullRequest,
  Mail,
  Send,
  Info,
} from "lucide-react";
import { CareerSchedulerService } from "@/modules/scheduler/service";
import {
  ScheduledTaskConfig,
  ScheduledTaskType,
  NotificationType,
  TaskRunRecord,
  AppNotificationItem,
} from "@/modules/scheduler/types";
import Link from "next/link";

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: "USER" | "AGENT" | "SYSTEM";
  module: string;
  action: string;
  status: "SUCCESS" | "BLOCKED" | "WARNING" | "APPROVAL_REQUIRED";
  details: string;
}

const AUDIT_LOGS: AuditEntry[] = [
  {
    id: "audit-001",
    timestamp: "2026-10-22 00:59:12",
    actor: "SYSTEM",
    module: "DATABASE",
    action: "DEMO_SEED_INITIALIZED",
    status: "SUCCESS",
    details: '{"event": "Seed populated across 28 entities", "mode": "demo_isolated"}',
  },
  {
    id: "audit-002",
    timestamp: "2026-10-22 00:59:15",
    actor: "AGENT",
    module: "APPROVAL",
    action: "APPROVAL_REQUEST_CREATED",
    status: "APPROVAL_REQUIRED",
    details: '{"actionType": "SEND_EMAIL", "target": "Ananya Sharma (Stripe)", "ttlMinutes": 30}',
  },
  {
    id: "audit-003",
    timestamp: "2026-10-22 00:59:20",
    actor: "SYSTEM",
    module: "CONTRIBUTION_SANDBOX",
    action: "LOCAL_TESTS_EXECUTED",
    status: "SUCCESS",
    details: '{"suite": "pytest tests/test_benchmark.py", "passed": 3, "exitCode": 0}',
  },
  {
    id: "audit-004",
    timestamp: "2026-10-22 00:59:25",
    actor: "AGENT",
    module: "SECURITY_GUARD",
    action: "REMOTE_WRITE_BLOCKED",
    status: "BLOCKED",
    details: '{"reason": "Attempted remote git push blocked: pending user approval"}',
  },
  {
    id: "audit-005",
    timestamp: "2026-10-22 01:15:30",
    actor: "SYSTEM",
    module: "SCHEDULER",
    action: "TASK_JOB_SWEEP_EXECUTED",
    status: "SUCCESS",
    details: '{"taskType": "JOB_SWEEP", "status": "SUCCESS", "durationMs": 820, "retryCount": 0}',
  },
];

export default function ActivityLogPage() {
  const [schedulerService] = useState(() => new CareerSchedulerService());
  const [isPausedAll, setIsPausedAll] = useState<boolean>(schedulerService.getIsPausedAll());
  const [tasks, setTasks] = useState<ScheduledTaskConfig[]>(schedulerService.getTasks());
  const [runHistory, setRunHistory] = useState<TaskRunRecord[]>(schedulerService.getRunHistory());
  const [notifications, setNotifications] = useState<AppNotificationItem[]>(
    schedulerService.getNotifications()
  );
  const [notificationFilter, setNotificationFilter] = useState<NotificationType | "ALL">("ALL");
  const [weeklyReport] = useState(() => schedulerService.getWeeklyReview());

  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "warning" | "error";
  } | null>(null);

  const [activeTab, setActiveTab] = useState<
    "scheduler" | "weekly_review" | "notifications" | "audit"
  >("scheduler");

  // Toggle master pause-all switch
  const handleTogglePauseAll = () => {
    const nextState = !isPausedAll;
    schedulerService.setPauseAll(nextState);
    setIsPausedAll(nextState);
    setNotifications(schedulerService.getNotifications());
    setStatusMessage({
      text: nextState
        ? "Scheduler PAUSED. All automated sweeps, background tasks, and notifications suspended."
        : "Scheduler RESUMED. Operating on Asia/Kolkata timezone schedule.",
      type: nextState ? "warning" : "success",
    });
  };

  // Run a scheduled task on-demand
  const handleRunTask = async (taskType: ScheduledTaskType) => {
    setRunningTaskId(taskType);
    setStatusMessage(null);
    try {
      const result = await schedulerService.executeTask("user-badri-001", taskType, true);
      setTasks(schedulerService.getTasks());
      setRunHistory(schedulerService.getRunHistory());
      setNotifications(schedulerService.getNotifications());
      setStatusMessage({
        text: `Executed ${taskType}: ${result.summary} (${result.durationMs}ms)`,
        type: result.status === "SUCCESS" ? "success" : "warning",
      });
    } catch (err: any) {
      setStatusMessage({
        text: `Execution failed: ${err.message}`,
        type: "error",
      });
    } finally {
      setRunningTaskId(null);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = (id: string) => {
    schedulerService.markAsRead(id);
    setNotifications([...schedulerService.getNotifications()]);
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    notifications.forEach((n) => schedulerService.markAsRead(n.id));
    setNotifications([...schedulerService.getNotifications()]);
  };

  const filteredNotifications =
    notificationFilter === "ALL"
      ? notifications
      : notifications.filter((n) => n.type === notificationFilter);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner if Scheduler is Paused */}
      {isPausedAll && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">MASTER SCHEDULER PAUSED</p>
              <p className="text-xs text-amber-200/80">
                All background sweeps, issue triage syncs, and LinkedIn draft generations are paused. Manual “Run Now” is still available.
              </p>
            </div>
          </div>
          <button
            onClick={handleTogglePauseAll}
            className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition shrink-0"
          >
            Resume Scheduler
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-teal-600" />
              Scheduler & Notification Operations
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-mono font-medium">
              Asia/Kolkata (IST, UTC+05:30)
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Opt-in automated pipelines, idempotent scheduling, weekly operations digest, and sensitive-data scrubbed notifications.
          </p>
        </div>

        {/* Master Control Switch */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePauseAll}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition shadow-xs ${
              isPausedAll
                ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                : "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
            }`}
          >
            {isPausedAll ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Resume All Schedules
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                Pause All Schedules
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Feedback Toast/Message */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : statusMessage.type === "warning"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("scheduler")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === "scheduler"
              ? "bg-indigo-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Scheduled Tasks & Controls ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab("weekly_review")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === "weekly_review"
              ? "bg-indigo-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Weekly Review & Honest Metrics
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition relative ${
            activeTab === "notifications"
              ? "bg-indigo-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Notification Center
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition ${
            activeTab === "audit"
              ? "bg-indigo-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Security Audit Trail ({AUDIT_LOGS.length})
        </button>
      </div>

      {/* TAB 1: Scheduled Tasks & Controls */}
      {activeTab === "scheduler" && (
        <div className="space-y-6">
          <div className="omni-card border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Configured Operational Schedules</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Idempotent execution with 60-second cooldown, exponential backoff retries, and strict action-approval guardrails.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 font-medium">
                Timezone: Asia/Kolkata
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {tasks.map((task) => (
                <div key={task.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold text-slate-900">{task.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          task.lastRunStatus === "SUCCESS"
                            ? "bg-teal-50 text-teal-700 border border-teal-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {task.lastRunStatus || "PENDING"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{task.lastRunSummary}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-mono text-teal-700 font-medium">
                        <Clock className="w-3 h-3" />
                        {task.cronDescriptionIst} ({task.cronExpression})
                      </span>
                      <span>Next Run: <span className="text-slate-800 font-medium">{task.nextRunAtIst}</span></span>
                      {task.lastSuccessAt && (
                        <span>
                          Last Success:{" "}
                          <span className="text-teal-700 font-mono font-medium">
                            {new Date(task.lastSuccessAt).toLocaleDateString()}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      disabled={runningTaskId === task.taskType || isPausedAll}
                      onClick={() => handleRunTask(task.taskType)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition shadow-xs ${
                        isPausedAll
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          : runningTaskId === task.taskType
                          ? "bg-teal-50 text-teal-700 border-teal-200 cursor-wait"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <RotateCw
                        className={`w-3.5 h-3.5 ${
                          runningTaskId === task.taskType ? "animate-spin text-teal-600" : "text-teal-600"
                        }`}
                      />
                      {runningTaskId === task.taskType ? "Running..." : "Run Now"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Execution History */}
          <div className="omni-card border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              Task Execution History & Backoff Logs
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {runHistory.map((run) => (
                <div key={run.id} className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">{run.executedAtIst}</span>
                      <span className="font-semibold text-slate-900">{run.taskType}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                          run.status === "SUCCESS"
                            ? "bg-teal-50 text-teal-700 border border-teal-200"
                            : run.status === "BLOCKED_PAUSED"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs">{run.resultSummary}</p>
                  </div>
                  <div className="text-right shrink-0 font-mono text-[11px] text-slate-500">
                    <div className="font-medium text-slate-700">{run.durationMs}ms</div>
                    <div className="text-[10px]">retries: {run.retryAttempt}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Weekly Review & Honest Metrics */}
      {activeTab === "weekly_review" && (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="omni-card border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  Weekly Career Operations Briefing
                </h2>
                <p className="text-xs text-slate-500">
                  Reporting Period: {weeklyReport.periodStart} to {weeklyReport.periodEnd} (Asia/Kolkata)
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-mono font-semibold">
                Verified Outcome Pipeline
              </span>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {weeklyReport.executiveSummary}
            </p>

            {/* Strict Honest Pipeline Distinction */}
            <div className="p-4 rounded-xl bg-teal-50/40 border border-teal-200 space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-700" />
                <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                  Honest Status Accountability Matrix
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                CareerOS enforces the <strong>Evidence Before Claims</strong> hard rule: unsent drafts are never counted as applications, and proposed PRs are never counted as contributions. Every pipeline phase is tracked independently:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                {/* Jobs */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-xs font-semibold text-slate-900">Jobs & Radar</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 pt-1 font-mono">
                    <span>Discovered:</span> <span className="text-slate-900 font-semibold">{weeklyReport.pipelineCounts.jobs.suggested}</span>
                    <span>Tailored:</span> <span className="text-slate-900 font-semibold">{weeklyReport.pipelineCounts.jobs.drafted}</span>
                    <span>Approved:</span> <span className="text-teal-700 font-semibold">{weeklyReport.pipelineCounts.jobs.approved}</span>
                    <span>Submitted:</span> <span className="text-teal-700 font-semibold">{weeklyReport.pipelineCounts.jobs.executed}</span>
                  </div>
                </div>

                {/* GitHub */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-xs font-semibold text-slate-900">GitHub & Open Source</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 pt-1 font-mono">
                    <span>Triaged:</span> <span className="text-slate-900 font-semibold">{weeklyReport.pipelineCounts.github.suggested}</span>
                    <span>Patches:</span> <span className="text-slate-900 font-semibold">{weeklyReport.pipelineCounts.github.drafted}</span>
                    <span>Sandboxed:</span> <span className="text-teal-700 font-semibold">{weeklyReport.pipelineCounts.github.executed}</span>
                    <span>Merged PRs:</span> <span className="text-teal-700 font-semibold">{weeklyReport.pipelineCounts.github.verifiedOutcome}</span>
                  </div>
                </div>

                {/* Recruiter Outreach */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-xs font-semibold text-slate-900">Outreach Emails</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 pt-1 font-mono">
                    <span>Identified:</span> <span className="text-slate-900 font-semibold">{weeklyReport.pipelineCounts.outreach.suggested}</span>
                    <span>Drafted:</span> <span className="text-slate-900 font-semibold">{weeklyReport.pipelineCounts.outreach.drafted}</span>
                    <span>Approved:</span> <span className="text-teal-700 font-semibold">{weeklyReport.pipelineCounts.outreach.approved}</span>
                    <span>Sent:</span> <span className="text-teal-700 font-semibold">{weeklyReport.pipelineCounts.outreach.executed}</span>
                  </div>
                </div>

                {/* LinkedIn Content */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-xs font-semibold text-slate-900">LinkedIn Studio</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 pt-1 font-mono">
                    <span>Themes:</span> <span className="text-slate-900 font-semibold">{weeklyReport.pipelineCounts.content.suggested}</span>
                    <span>Drafts:</span> <span className="text-slate-900 font-semibold">{weeklyReport.pipelineCounts.content.drafted}</span>
                    <span>Approved:</span> <span className="text-teal-700 font-semibold">{weeklyReport.pipelineCounts.content.approved}</span>
                    <span>Published:</span> <span className="text-teal-700 font-semibold">{weeklyReport.pipelineCounts.content.verifiedOutcome}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Wins & Bottlenecks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
                <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Key Verified Wins
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  {weeklyReport.keyWins.map((win, idx) => (
                    <li key={idx} className="leading-snug">{win}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 space-y-2">
                <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Active Bottlenecks & Discrepancies
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  {weeklyReport.activeBottlenecks.map((bottleneck, idx) => (
                    <li key={idx} className="leading-snug">{bottleneck}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Stale Items Explanation */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider font-bold">
                Stale Items & Expiration Explanations
              </h4>
              <ul className="space-y-1 text-xs text-slate-600">
                {weeklyReport.staleItemsExplanation.map((explanation, idx) => (
                  <li key={idx} className="font-mono text-[11px]">• {explanation}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Notification Center */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <div className="omni-card border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-teal-600" />
                  Actionable Notification Center
                </h2>
                <p className="text-xs text-slate-500">
                  All sensitive tokens, private keys, and raw resume contents are automatically scrubbed.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 transition shadow-xs"
                >
                  Mark All Read
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {(["ALL", "APPROVAL_REQUIRED", "TASK_COMPLETED", "SYSTEM_ALERT"] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setNotificationFilter(filter)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition border ${
                      notificationFilter === filter
                        ? "omni-btn-primary text-white border-transparent"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {filter === "ALL"
                      ? "All Notifications"
                      : filter === "APPROVAL_REQUIRED"
                      ? "Approval Required"
                      : filter === "TASK_COMPLETED"
                      ? "Task Completed"
                      : "System Alerts"}
                  </button>
                )
              )}
            </div>

            {/* Notification List */}
            <div className="divide-y divide-slate-100 pt-2">
              {filteredNotifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No notifications matching filter.
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`py-3.5 flex items-start justify-between gap-4 transition ${
                      !n.isRead ? "bg-teal-50/40 px-3 rounded-xl border border-teal-100" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                            n.type === "APPROVAL_REQUIRED"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : n.type === "SYSTEM_ALERT"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-teal-50 text-teal-700 border border-teal-200"
                          }`}
                        >
                          {n.type}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-900">{n.title}</h4>
                        <span className="text-[11px] font-mono text-slate-500">{n.createdAtIst}</span>
                      </div>
                      <p className="text-xs text-slate-600">{n.message}</p>
                      {n.linkUrl && (
                        <Link
                          href={n.linkUrl}
                          className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:underline pt-0.5 font-medium"
                        >
                          View Action <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          title="Mark as Read"
                          className="p-1.5 rounded-lg hover:bg-white text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Audit Log Table */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="omni-card border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Immutable Audit Log</h3>
                <p className="text-xs text-slate-500">All external action attempts, approval checks, and sandbox invocations</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-mono text-slate-700 border border-slate-200 font-semibold">
                PII Redaction: Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Module / Action</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Redacted Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {AUDIT_LOGS.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                            log.actor === "USER"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : log.actor === "AGENT"
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {log.actor}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900">{log.module}</span>
                        <span className="text-slate-400 mx-1.5">/</span>
                        <span className="font-mono text-slate-600">{log.action}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                            log.status === "SUCCESS"
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : log.status === "BLOCKED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
