# CareerOS — Data Model and State Contracts

This document defines domain-level entities. Antigravity may normalize the exact Prisma schema, but it must preserve these semantics, invariants, and audit relationships. Avoid storing the same personally identifying information in multiple tables.

## 1. Core entities

### UserProfile

Single-user identity and display settings. Store only fields needed by the app; do not duplicate provider profile data unnecessarily.

### CareerPreferences

Role families, required/optional keywords, target locations, remote/hybrid/on-site preference, minimum salary/stipend if supplied, company preferences/exclusions, graduation date, work authorization/eligibility details only if the user provides them, and outreach/content preferences. Version material changes.

### EvidenceFact

A normalized claim available for generation: `factType`, `value`, `sourceType`, `sourceUrl` or private file pointer, `sourceLocator` (page/line/section when useful), `verificationStatus`, `confidence`, `capturedAt`, `lastVerifiedAt`, `conflictGroup`, and `userConfirmedAt`. Keep raw private source content out of ordinary queries where possible.

### ResumeDocument / ResumeVersion

Private base file metadata and tailored versions. Store object/file pointer, checksum, uploaded date, visibility, version lineage, job association, and approval state. The original file must remain immutable. The binary file must be in private storage, not `public/` or source control.

### ConnectedAccount

Provider, external account ID, encrypted token reference, granted scopes/capabilities, connection state, token expiry, last successful sync, last error category, connected/disconnected timestamps, and revocation status. Secrets must never be stored in plaintext.

### JobSource / JobOpening

Source configuration and normalized job data: canonical URL, company, title, description or bounded summary, location/work mode, role type, seniority, posted/expiry dates when known, found/last-checked timestamps, verification status, source evidence, dedupe hash, and active/stale/expired/suspicious state.

### JobMatch / JobApplication

Store match components independently (role, skills, evidence, seniority, location, eligibility, recency) with weights/version. Track application stage and actual event history. Do not infer an application has been submitted from clicking “prepare.”

Application status examples: `discovered`, `shortlisted`, `drafting`, `ready_for_review`, `approved`, `applied`, `assessment`, `interview`, `rejected`, `offer`, `closed`, `withdrawn`.

### RecruiterContact / NetworkLead

Use a minimal identity and professional context, source URL, company/role, relevance rationale, discovered timestamp, verification state, contact-channel provenance, last-contact date, do-not-contact/opt-out state, and user notes. Avoid inferring sensitive personal attributes.

### OutreachDraft / OutreachEvent

Draft content/version, purpose, source job, recipient reference, attachment version, dedupe key, approval ID, provider ID, timestamps, and status. Events record state transitions with minimal metadata, not full raw email content.

Outreach status examples: `research`, `draft`, `needs_review`, `approved`, `sent`, `delivered` (only if confirmed), `replied`, `follow_up_due`, `opted_out`, `bounced`, `closed`, `failed`, `blocked`.

### LinkedInContentDraft

Topic, intended audience, text/version, evidence-fact IDs, similarity/repetition warnings, draft/approval/publish state, optional published URL/provider ID, and timestamps. Publication state may be set only from verified result evidence.

### RepositoryWatch / RepositorySnapshot

Canonical repository ID/URL, owner/name, owned/forked/watch status, default branch, language/topics, stars/forks when supplied by provider, source timestamp, refresh metadata, and error state.

### IssueCandidate

Repository ID, issue ID/URL, title/body summary, labels, author/assignee only when needed, open/closed state, created/updated timestamps, contribution guide status, duplicate/stale assessment, fit breakdown, complexity estimate with uncertainty, source data timestamp, and triage decision.

### ContributionTask / SandboxRun

Issue link, repository/base branch/head branch, plan, sandbox/worktree pointer, changed-file list, diff hash, executed commands, exit codes, test result summary, warnings, review state, approval reference, and cleanup state. Never include secret values or unrestricted file paths in logs.

Contribution states: `candidate`, `investigating`, `planned`, `sandbox_created`, `patch_ready`, `testing`, `tests_passed`, `tests_failed`, `needs_review`, `approved_for_remote_write`, `pr_opened`, `merged`, `closed`, `blocked`, `discarded`.

### PullRequestRecord

Repository and PR URL/number, source issue, base/head refs, title/body version, opened/updated/merged timestamps, provider status, checks state, and verified events. A local draft PR must not be represented as a remote PR.

### SkillGap / PracticeSession

Skill label, requirement type, evidence status, originating job IDs, practice plan, session notes, self-assessment, timestamps, and next step. Do not represent an unverified keyword as proven expertise.

### ScheduledTask / TaskRun / Notification

Schedule expression/time zone, enabled/paused state, action type, run window, dedupe key, status, attempts, last result, next run, and redacted error category. A task cannot hold an implicit approval for an external write.

### ApprovalRequest

Action type, target ID, normalized target, exact content/diff version/hash, consequence summary, requested timestamp, expiry, approval state, approver, approval timestamp, execution state, and revalidation results. A stale or mismatched approval is invalid.

### AuditEvent

Actor (`user`, `agent`, `system`), module/action, target resource, status, request/run correlation ID, timestamps, redacted details, and links to evidence/approval where appropriate. Do not log secrets, full message bodies, or resume data.

## 2. Relationship guide

- One `UserProfile` has one current `CareerPreferences` record with version history.
- `EvidenceFact` can be referenced by many drafts, resume versions, job matches, and interview stories.
- `JobOpening` can have many `JobMatch` records over time and at most one active deduplicated application record per user/role application context.
- `RecruiterContact` may relate to multiple `JobOpening` records; each `OutreachDraft` references one contact and optionally one job.
- `ContributionTask` references one issue candidate/repository and may yield multiple sandbox runs, but only one approved remote operation for a particular version.
- `PullRequestRecord` must be linked to a verified provider result, not just a draft.
- `ApprovalRequest` references the exact external action/version it authorizes.
- `ScheduledTask` generates `TaskRun` records; runs create `AuditEvent` entries.

## 3. Status and event integrity

- Prefer append-only event records for important state changes, while keeping a normalized current status for efficient queries.
- State transitions must be validated server-side against an allowed transition map.
- Never change `draft` directly to `sent`, `published`, or `pr_opened` without an execution result.
- Retryable provider failures must not generate duplicate remote actions. Use unique idempotency/dedupe keys and reconcile ambiguous responses before retrying non-idempotent operations.
- `merged` must come from a verified GitHub state/event. A merged count may not be inferred from a local branch or open PR.

## 4. Indexes and uniqueness

Implement indexes/constraints at least for:

- normalized canonical job URL and job dedupe hash;
- provider + external account ID;
- GitHub repository ID and issue/PR ID;
- outreach dedupe key and recipient/job/campaign tuple;
- active task dedupe key and scheduled execution window;
- approval action + target + content/diff hash + state;
- timestamps/status for dashboards and task processing.

Deduplication must be enforced in the database/service path, not only in the UI.

## 5. Data minimization and retention

- Store source links and normalized summaries rather than unrestricted copies of external page content where practical.
- Store private files outside public web paths with controlled access.
- Redact or expire temporary sandbox files and generated artifacts according to a documented retention policy.
- Keep enough event metadata for accountability without preserving unnecessary sensitive content.
- Provide export and deletion paths, including tokens, uploaded files, derived previews, job/contact records, and logs as applicable.
