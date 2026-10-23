---
name: weekly-review
description: Generates comprehensive weekly career operations summaries, aggregating job applications, networking outreach, GitHub activity, content drafts, and upcoming action items.
---

# Weekly Review Skill

## Purpose
Synthesize weekly activity, metrics, open-source progress, outreach results, and upcoming priorities into an actionable, honest career operations briefing for Badri Vishal Pandey. Provides clear visibility into actual outcomes versus pending drafts without inflated counts.

## Inputs
- `date_range`: Start and end date for the review cycle (typically the past 7 days).
- `application_records`: Job application statuses and updates from the database.
- `outreach_records`: Networking messages prepared, approved, and sent.
- `github_activity`: Repositories inspected, issues triaged, contributions tested, and PR statuses.
- `content_records`: LinkedIn posts drafted, approved, and published.
- `goals`: Current weekly and monthly career objectives.

## Operational Rules & Boundaries
1. **Honest status classification (Hard Rule)**: Strict categorization of events into:
   - `DISCOVERED`: Items found or recommended.
   - `DRAFTED`: Work created locally but not reviewed.
   - `APPROVED`: Work formally accepted by the user.
   - `EXECUTED`: Outward actions actually dispatched (sent emails, pushed code).
   - `VERIFIED`: Confirmed external outcomes (maintainer responses, interview invites, merged PRs).
   Never aggregate drafts into completed action totals.
2. **Zero fabrication**: Report exact numbers, dates, and outcomes. If an outreach resulted in no response, report "No response received" rather than guessing status.
3. **Privacy protection**: Redact sensitive recruiter personal details (personal phone numbers, private emails) from markdown exports or shared summaries.
4. **Actionable focus**: Highlight bottlenecks, stale applications (>14 days without update), and upcoming deadlines.

## Execution Steps
1. **Data Aggregation**:
   - Query CareerOS database for events within `date_range`.
   - Aggregate:
     - New job openings discovered, shortlisted, and applied.
     - Outreach messages drafted, approved, and dispatched.
     - GitHub contribution tasks in progress, tested, or merged.
     - Content drafts created and posted.
2. **Metric & Status Computation**:
   - Compute key pipeline indicators:
     - Application response rate (% of applications receiving feedback).
     - Outreach follow-up queue (contacts requiring 7-day follow-up).
     - Open-source test pass rate and PR review turnaround.
3. **Bottleneck & Anomaly Detection**:
   - Identify applications awaiting follow-up or stale recruiter threads.
   - Flag issues in contribution workbench blocked by failing tests or unclear requirements.
4. **Digest Formulation**:
   - Generate structured markdown report with:
     - Executive summary (key wins, challenges).
     - Verified Metrics Table (honest counts by state).
     - Job Application Pipeline.
     - Open-Source Contribution Lab Summary.
     - Networking & Recruiter Outreach Status.
     - Content Studio Status.
     - Top 3 Priorities for the Coming Week.
5. **Persistence**:
   - Save the digest to `docs/reviews/weekly_YYYY-MM-DD.md` or database.

## Outputs
- `WeeklyReviewDigest`:
  - `id`: Unique review identifier.
  - `period_start`: Cycle start date.
  - `period_end`: Cycle end date.
  - `content`: Formatted markdown review digest.
  - `metrics`:
    - `jobs_discovered`: Count.
    - `jobs_applied`: Count (verified submissions only).
    - `outreach_sent`: Count.
    - `prs_opened`: Count.
    - `prs_merged`: Count.
    - `posts_published`: Count.
  - `priority_action_items`: Array of high-priority tasks for next week.

## Approval Gates
- **Informational Digest**: The weekly review is an internal operational artifact and does not execute external actions.
- Any recommended action items (e.g., triggering outreach or applying to a shortlisted role) require individual action-specific approvals through their respective skills.

## Failure Handling
- **Empty / Incomplete Period Data**: If no activity was logged for a specific module, clearly state "No activity logged" rather than omitting the section or inventing data.
- **Data Desynchronization**: If external PR or message status cannot be verified (e.g., API offline), mark the status as `STATUS_UNKNOWN / PENDING_VERIFICATION` with a warning note.
