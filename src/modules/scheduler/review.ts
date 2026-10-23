import { WeeklyReviewReport, VerifiedPipelineCounts } from "./types";

/**
 * Formats a Date object into Asia/Kolkata timezone string
 */
export function formatIstTimestamp(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Generates an honest, explainable weekly operations briefing.
 * HARD RULE: Never count an unsent draft as an application or a proposed PR as a contribution.
 * Strictly distinguishes suggested, drafted, approved, executed, and verified outcomes.
 */
export function generateWeeklyReviewReport(): WeeklyReviewReport {
  const periodStart = "2026-10-15";
  const periodEnd = "2026-10-22";

  const jobsPipeline: VerifiedPipelineCounts = {
    suggested: 5,        // 5 roles discovered matching AI/ML, backend, and embedded preferences
    drafted: 1,          // 1 tailored resume drafted for Stripe SWE Intern
    approved: 1,         // 1 tailored resume explicitly approved with SHA-256 hash
    executed: 0,         // Zero auto-applications (user must review and submit manually)
    verifiedOutcome: 0,  // Zero verified interviews or offers yet
  };

  const githubPipeline: VerifiedPipelineCounts = {
    suggested: 2,        // 2 issues triaged with explainable rubric
    drafted: 1,          // 1 contribution plan and patch diff prepared
    approved: 2,         // Dual approvals: 1 for remote push + 1 for opening PR
    executed: 1,         // 1 isolated sandbox test suite executed (pytest passed in 420ms)
    verifiedOutcome: 1,  // 1 verified merged PR #4 on WaferOS repository
  };

  const outreachPipeline: VerifiedPipelineCounts = {
    suggested: 4,        // 4 verified leads identified from public conference talks and team pages
    drafted: 2,          // 2 personalized one-to-one drafts prepared
    approved: 1,         // 1 email draft approved with SHA-256 hash
    executed: 1,         // 1 email dispatched via Gmail API
    verifiedOutcome: 0,  // Zero replies confirmed yet (awaiting follow-up window)
  };

  const contentPipeline: VerifiedPipelineCounts = {
    suggested: 3,        // 3 rotating candidate themes scheduled (Build Log, Debugging, DSA)
    drafted: 3,          // 3 candidate drafts prepared with evidence links and visual concepts
    approved: 1,         // 1 post approved with SHA-256 hash
    executed: 1,         // 1 post manually copied and launched in LinkedIn feed
    verifiedOutcome: 1,  // 1 published open-source build log active on public profile
  };

  return {
    periodStart,
    periodEnd,
    timezone: "Asia/Kolkata",
    executiveSummary:
      "Weekly operations focused on high-signal technical visibility and verified application readiness. Accomplished 1 merged open-source PR on WaferOS benchmarking, 1 tailored resume approved for Stripe infrastructure, 1 approved recruiter outreach email, and maintained a 190-day active LeetCode streak (184 problems solved).",
    pipelineCounts: {
      jobs: jobsPipeline,
      github: githubPipeline,
      outreach: outreachPipeline,
      content: contentPipeline,
    },
    keyWins: [
      "Merged PR #4 on WaferOS: added isolated batch inference profiling and latency benchmarks.",
      "Maintained 190-day active daily LeetCode streak (184 problems solved: 118 easy, 62 medium, 4 hard, 200 Days Badge).",
      "Drafted and approved truthful tailored resume for Stripe Infrastructure SWE Intern with zero fabricated claims.",
      "Identified 4 high-match engineering mentors and recruiters from verified public sources with shared technical domains.",
    ],
    activeBottlenecks: [
      "Graduation year discrepancy resolved: Verified as 2028 (GCET B.Tech 3rd year ECE). All eligibility filters now calibrated for Class of 2028.",
      "Qualcomm outreach thread has elapsed 9 days without response; now eligible for 1 polite follow-up.",
      "Datadog systems intern opening requires Go telemetry and Kafka familiarity (active study gaps).",
    ],
    upcomingPriorities: [
      "Prepare and dispatch 1 polite follow-up for Qualcomm Edge AI opening.",
      "Execute Week 2 study plan: PyTorch INT8 dynamic quantization and latency profiling.",
      "Triage new open-source issues in PyTorch vision loaders for outside contribution workbench.",
    ],
    staleItemsExplanation: [
      "Qualcomm Outreach (9 days elapsed): No reply yet. System has flagged thread for polite follow-up draft review under 7-day rule.",
      "Legacy Defense Corp posting (75 days old): Classified as stale and automatically excluded from active radar.",
    ],
    generatedAtIst: formatIstTimestamp(new Date()),
  };
}
