# Product Requirements Document (PRD) — CareerOS

**Status:** Initial product specification; user confirmation is required for open questions.  
**Product:** CareerOS personal career and open-source operations agent.  
**Initial user:** Badri Vishal Pandey.  
**Primary objective:** Help one engineering student consistently discover suitable career opportunities, create evidence-backed professional content, and make valuable open-source contributions with a reviewable record of each action.

## 1. Problem statement

Career development involves repeated research and context switching across LinkedIn, GitHub, job boards, email, a resume, a portfolio, and interview preparation. A general-purpose bot can generate activity without improving outcomes, duplicate outreach, make unsupported claims, or create risky code changes. CareerOS should centralize the workflow, make recommendations explainable, preserve a trustworthy evidence trail, and automate preparation before execution.

## 2. Product principles

1. **Evidence before claims:** career statements must link back to a resume line, repository, commit, PR, certification, public posting, or user-confirmed fact.
2. **Human control for consequential actions:** external communications and repository writes must use action-specific approvals.
3. **Quality over volume:** prioritize relevant connections, appropriate jobs, and meaningful contributions instead of vanity counts.
4. **Small, inspectable implementation:** build as a modular monolith first; use provider adapters and typed boundaries.
5. **Honest status:** distinguish discovered, recommended, drafted, approved, executed, and verified outcomes.
6. **Respect service policies:** use authorized APIs, permitted sources, and manual handoff when API access is unavailable.
7. **Privacy by default:** collect the minimum data needed, restrict access, and provide disconnect/deletion controls.

## 3. Target user and initial preferences

The first release is single-user and must not require a multi-tenant SaaS architecture. Suggested, editable targeting defaults:

- Roles: AI/ML Engineer or Intern; Computer Vision/ML Intern; Software/Backend Engineer or Intern; Embedded Systems/IoT Engineer or Intern; semiconductor inspection/AI-quality roles.
- Geography: Greater Noida, Noida, Delhi NCR, India-wide, and remote.
- Technical profile: Python, C/C++, TypeScript/JavaScript, SQL, PyTorch, TensorFlow/Keras, scikit-learn, OpenCV, FastAPI, Node.js, React, PostgreSQL, Prisma, Redis, Docker, Arduino/ESP32, embedded interfaces, and DSA—each treated as a resume-reported skill until confirmed by evidence.
- Project evidence candidates: WaferOS, TravelBooking/ConfirmTkt clone, Smart Helmet, SENTINEL/drone work. Metrics in the resume are user-reported until linked to reproducible evaluation artifacts.

Do not hard-code these values in service logic; store them in the profile/preferences layer.

## 4. Goals

- Create a single dashboard for job discovery, networking recommendations, LinkedIn content drafts, Gmail outreach drafts, GitHub repository/issue intelligence, code contribution review, interview prep, and weekly reporting.
- Produce recommendations with reasons, sources, dates, fit signals, uncertainty, and next actions.
- Avoid duplicate jobs, outreach, issue work, and scheduled runs.
- Allow the agent to prepare local Git branches and test proposed changes in isolated workspaces, with the user approving remote writes.
- Support mock/demo mode before live accounts are connected.
- Make every important external action and state transition auditable.

## 5. Non-goals for the first release

- No public multi-user SaaS, billing, employer dashboard, or team collaboration.
- No guaranteed job placement, automated application spam, mass recruiting email, or fabricated resume tailoring.
- No unauthorized LinkedIn scraping or browser automation of social actions.
- No autonomous send/publish/push/PR creation without the designated approval.
- No autonomous merging of pull requests or changing repository branch protection.
- No rewriting or deploying the user's existing portfolio as part of this project.
- No arbitrary code execution in the primary app process or access to production secrets from contribution sandboxes.

## 6. Functional requirements

### FR-01 — Profile and evidence vault (P0)

Store career preferences and source-backed facts. A fact has a value, source type/URL or file pointer, verification status, timestamp, and optional confidence. Conflicting facts are surfaced to the user rather than silently reconciled.

**Acceptance:** every generated resume bullet, post, or outreach draft can display the evidence used; an unsupported claim is omitted or marked for confirmation.

### FR-02 — Dashboard and activity ledger (P0)

Provide Overview, LinkedIn Studio, Network, Jobs, Email Outreach, GitHub Lab, Contributions/PRs, Interview Prep, Activity Log, and Settings. Clearly distinguish demo data from live data and drafted actions from completed ones.

**Acceptance:** zero connected accounts still yields a functional demo experience and no fake metric is presented as real.

### FR-03 — GitHub repository intelligence (P0)

Use the official GitHub API to inspect the user's repositories, forks, configured watchlist, relevant public repositories, issue metadata, repository activity, and available trend signals. Do not claim “trending” unless a source/heuristic and observation window are displayed. Respect permissions and API rate limits.

**Acceptance:** recommendations include canonical repo/issue links, freshness, labels, language/stack, why the issue fits, duplicate/stale status, likely complexity, and contributing-guide status where available.

### FR-04 — Contribution workbench (P0)

For a selected issue, inspect repository instructions and relevant code, build an implementation plan, create an isolated local workspace/branch, make a minimal patch, run appropriate tests, and display the diff and test logs. Keep generated changes reviewable.

**Acceptance:** no push or PR can occur until user approves the exact repository, branch, diff, test result, title, and body. Failed tests or suspicious scripts block the remote action by default.

### FR-05 — LinkedIn content studio (P0)

Create up to three personalized weekly post drafts from verified recent work, learning, projects, or contributions. Each draft should include the intended audience, factual evidence, optional media suggestion, and an editable CTA. Avoid generic motivational filler and repetitive story patterns.

**Acceptance:** no post is published by browser automation. Publishing is either an authorized permitted API operation after explicit approval, or manual handoff.

### FR-06 — Networking recommendations (P1)

Rank people and organizations by the user's target field, recent/relevant work, role, geography, alumni/community relevance when publicly available, and legitimate contact context. Explain why a person is relevant. Prepare a connection note or message for manual use where appropriate.

**Acceptance:** no automated invitations or DMs; no private/sensitive attribute inference; no guessed personal contact data.

### FR-07 — Job/internship discovery and scoring (P0)

Collect listings from permitted public sources, authorized APIs, and user-configured feeds. Normalize and deduplicate by canonical URL/company/role/location. Score role relevance, demonstrable skills, seniority, eligibility, geography/work mode, and age/freshness; show hard blockers separately from skill gaps.

**Acceptance:** every live listing stores the source URL, found date, last checked date, and validity state. Expired or suspicious posts are flagged. The score is explainable and configurable.

### FR-08 — Resume tailoring (P1)

Create a separate role-specific copy from the selected base resume. Show changes and matched/missing keywords. Preserve provenance and version history.

**Acceptance:** base resume remains immutable; no qualifications, projects, dates, metrics, experience, or patent status are added without evidence and approval. Export a PDF only after review.

### FR-09 — Gmail recruiter outreach (P1)

Find or import legitimate recruiting contacts from published sources, keep source evidence, prepare personalized one-to-one email drafts, and optionally attach the user-selected resume. Sending must remain disabled by default and require confirmation for each message.

**Acceptance:** unknown/guessed recipient, missing source, duplicate campaign, opt-out, inactive role, global pause, or missing approval blocks sending. Drafts are allowed without Gmail send permission where feasible.

### FR-10 — Interview preparation and skill gaps (P1)

Generate a per-role skills matrix and practice plan based on actual job descriptions and evidence from the profile. Include technical questions, relevant DSA practice, project deep dives, and experience-story prompts.

**Acceptance:** missing or unverified skills are labelled honestly; interview practice results can influence later recommendations.

### FR-11 — Scheduler, reminders, reports (P1)

Support opt-in scheduled refreshes, follow-up reminders, and a weekly review in Asia/Kolkata timezone. Every scheduled task must be idempotent, pausable, observable, and subject to action gates.

**Acceptance:** the weekly report separates proposed, drafted, approved, sent/published, and verified results; pause-all stops scheduled and user-triggered external actions that require approval.

### FR-12 — Security, settings, and data control (P0)

Use secure authentication, server-side authorization, least privilege, encrypted token storage, audit events, disconnect/revocation handling, export and deletion controls, and safe error messages.

**Acceptance:** secrets never appear in client bundles, source control, logs, or test output; account disconnection invalidates the integration and stops scheduled work dependent on it.

## 7. User journeys

### Journey A — Weekly career review

Dashboard → refresh sources → review ranked jobs and GitHub issues → inspect evidence and blockers → create approved next actions → review weekly report.

### Journey B — Open-source contribution

Select issue → validate that it is open and suitable → inspect guidelines/code → create isolated workspace → propose plan → edit and test → inspect diff → user approves exact PR details → push/open PR → track status.

### Journey C — Recruiter outreach

Select a verified job/contact → verify recipient provenance and opt-out state → generate a truthful tailored draft → preview recipient/body/attachment/source → user confirms sending → log provider result → create bounded follow-up reminder if appropriate.

### Journey D — LinkedIn content

Read approved career evidence and recent activity → propose varied topics → draft posts with source evidence → user edits/approves → authorized API or manual copy/open-page flow → record actual publication only after verified confirmation.

## 8. Success metrics

Use useful quality and outcome measures rather than activity volume alone:

- Share of recommendations with a valid source and freshness timestamp.
- Duplicate job/outreach rate.
- Percentage of generated factual claims linked to evidence.
- Contribution test pass rate and maintainer feedback/merge outcomes where verified.
- Time saved from discovery to a reviewed draft or contribution proposal.
- Job application response/interview conversion, tracked only with actual events and adequate context.
- Approval-gate block tests passed; number of external actions executed without approval must remain **zero**.
- User-rated usefulness of recommended jobs, people, posts, and issues.

Do not optimize for raw connection requests, email volume, post volume, issue count, or PR count alone.

## 9. Release milestones

- **M0 — Plan:** audit existing sources, settle open questions, approve architecture.
- **M1 — Local demo:** responsive dashboard, data model, mock providers, activity ledger, profile/evidence vault.
- **M2 — Read-only integrations:** GitHub, job-source adapters, account status, source provenance, rate-limit/error handling.
- **M3 — Drafting tools:** LinkedIn content, networking recommendations, resume tailoring, Gmail drafts.
- **M4 — Contribution sandbox:** safe local patch/testing workflow and explicit remote-write gate.
- **M5 — Controlled external actions:** user-approved Gmail send and GitHub PR open; LinkedIn only when permitted official API access exists.
- **M6 — Scheduling and hardening:** digest, reminders, pause-all, adversarial tests, backup/deletion guidance.

## 10. Risks and mitigations

- **Platform/API limits:** adapter-based integrations, documented scopes, manual fallback, no bypass.
- **Wrong profile claim:** evidence vault and blocking confirmation for conflicts.
- **Low-quality AI code:** isolated workspace, tests, diff review, no automatic merge.
- **Prompt injection:** treat external content as untrusted data and restrict tool authority.
- **Credential exposure:** least-privilege OAuth, encrypted storage, secret redaction, disconnect handling.
- **Too much complexity for one developer:** modular monolith, mock-first delivery, phase gates, avoid premature microservices.
- **Stale or fraudulent job posts:** provenance, freshness, verification status, warnings, and no guessed contact details.

## 11. Open decisions

See `OPEN_QUESTIONS.md`. The graduation-date discrepancy must be resolved before external job application or recruiter outreach. Role priorities, outreach cadence, and allowed geographic scope should be editable in Settings rather than hard-coded.
