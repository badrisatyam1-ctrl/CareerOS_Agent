# CareerOS — Pathwise Implementation Plan

**Rule:** execute phases in order. A phase is complete only after its acceptance checks pass and the implementation log is updated. Do not ask Antigravity to “build the whole thing” in one prompt.

## Phase 0 — Audit and decision freeze (no app code)

**Prompt:** Prompt 0 in `prompts/Antigravity_CareerOS_Agent_Prompts.md`.  
**Read:** all canonical docs plus the resume and provided public links.  
**Expected outputs:** `docs/PUBLIC_PROFILE_AUDIT.md`, `docs/OPEN_QUESTIONS.md`, and a concise decision report.  
**Must not:** build UI, modify any existing public repository, connect live accounts, send/publish/push/open a PR.

**Gate:** confirm graduation date; identify unavailable/unverified facts; approve stack and MVP scope. If a public page cannot be accessed, record that limitation instead of guessing.

## Phase 1 — Agent rules and reusable skills

**Prompt:** Prompt 1.  
**Expected paths:** `AGENTS.md` (reconcile with this canonical file; do not overwrite stronger rules), `.agents/skills/*/SKILL.md`, skill-specific notes as needed.  
**Must not:** integrate providers or implement product features.

**Gate:** seven focused skills exist, are concise, and include inputs, steps, outputs, approval rules, and failure handling. No skill can override `docs/rules.md` or `docs/security.md`.

## Phase 2 — Local app shell, schema, and demo mode

**Prompt:** Prompt 2.  
**Expected paths:** app shell under `src/`, Prisma schema/migrations, validators, demo seed, local setup docs, unit tests, `.env.example`, `.gitignore`.  
**Must not:** connect live external services.

**Gate:** app starts from written instructions; demo mode works with zero integrations; all demo records are labelled; lint/type checks/core tests pass; no secrets/private resume are in Git.

## Phase 3 — Auth and provider adapter framework

**Prompt:** Prompt 3.  
**Expected paths:** authentication/session guards, integration adapter interfaces, account capability view, encrypted-token design, mock adapters, disconnect path tests.  
**Must not:** request unnecessary scopes or enable write operations by default.

**Gate:** private routes reject unauthenticated/unauthorized requests; mock adapters are covered; revoked/insufficient-scope states fail safely; credentials remain server-side.

## Phase 4 — GitHub read-only intelligence

**Prompt:** Prompt 4.  
**Expected paths:** GitHub read adapter and GitHub Lab module, repository snapshots, issue candidates, filters, stale/duplicate detection, tests.  
**Must not:** push code, create issues, or open PRs.

**Gate:** every candidate has canonical source/freshness; rate limits and 403/404/429 cases are handled; issue recommendations explain relevance and uncertainty.

## Phase 5 — Contribution workbench

**Prompt:** Prompt 5.  
**Expected paths:** isolated sandbox/worktree manager, contribution plan, test log, diff viewer, approval service integration, fake-repo fixtures.  
**Must not:** use live remote writes during tests or expose production secrets to the worker.

**Gate:** fixture-repository flow can inspect → patch → test → show diff; untrusted script and prompt-injection fixtures fail safely; changed diff invalidates prior approval; remote-write button remains blocked by default.

## Phase 6 — LinkedIn content and networking

**Prompt:** Prompt 6.  
**Expected paths:** content studio, evidence-linked draft schema, weekly idea generator, networking shortlist, manual handoff behavior, mocked provider tests.  
**Must not:** scrape LinkedIn or automate browser-based invitations/messages/engagement.

**Gate:** drafts use evidence and varied topics; publication is disabled without an authorized official capability; manual handoff is explicit; no profile claims are invented.

## Phase 7 — Jobs and resume tailoring

**Prompt:** Prompt 7.  
**Expected paths:** job-source adapters, normalized job schema, match breakdown, eligibility blockers, resume-version diff, tests for stale/duplicate/unsupported claims.  
**Must not:** submit applications or overwrite the base resume.

**Gate:** deduplication works; live sources have URL/timestamps; fit is explainable; graduation-date conflict blocks outbound application; tailored changes are reviewable.

## Phase 8 — Gmail outreach

**Prompt:** Prompt 8.  
**Expected paths:** Gmail OAuth adapter, draft editor, contact provenance, attachment preview, outreach status/events, duplicate/opt-out/send gate tests.  
**Must not:** mass email; guess recipient addresses; send emails during tests.

**Gate:** draft-only mode is default; send requires individual fresh approval and successful revalidation; missing source, opt-out, duplicate, global pause, or invalid address blocks send; the exact attachment is previewed.

## Phase 9 — Skill gaps, interview preparation, evidence vault

**Prompt:** Prompt 9.  
**Expected paths:** skill matrix, study plan, practice sessions, source-backed career facts, claim checking, evidence traceability tests.  
**Must not:** treat keywords as proof of expertise.

**Gate:** generated claims resolve to evidence; unknown facts are omitted or flagged; learning recommendations connect to real target jobs.

## Phase 10 — Scheduler, notifications, reporting

**Prompt:** Prompt 10.  
**Expected paths:** durable scheduler/worker, job-run history, pause-all, reminders, weekly digest, retry/idempotency/timezone tests.  
**Must not:** allow scheduler to create implicit external-action approval.

**Gate:** duplicate task runs are prevented; pause-all blocks protected actions; timezone uses Asia/Kolkata for display; reports distinguish draft from execution and verified outcomes.

## Phase 11 — Security and reliability hardening

**Prompt:** Prompt 11.  
**Expected paths:** adversarial tests, authorization audit, secret/dependency scans, data retention/deletion notes, rate limiting, hardened input handling.  
**Must not:** report “fully secure” or hide skipped tests.

**Gate:** every listed abuse case is exercised or clearly marked not executable with a reason; all failures are documented and fixed or explicitly tracked as blockers.

## Phase 12 — End-to-end acceptance and handoff

**Prompt:** Prompt 12.  
**Expected paths:** updated `README.md`, local environment guide, OAuth setup guide, permission matrix, troubleshooting, test commands, deployment/back-up/deletion instructions, final test report.  
**Must not:** deploy publicly, use real send/publish/push/PR actions, or connect live accounts without a separate explicit request.

**Gate:** complete mock end-to-end flow succeeds; each action gate is demonstrably enforced on the server; setup is reproducible; unresolved limitations are listed honestly.

## Required phase report

At every gate report:

1. What was implemented and what was deliberately not implemented.
2. Exact files created/modified.
3. Commands run and exact exit status/results.
4. Tests skipped and the reason.
5. Security/quality issues found and whether they block the next phase.
6. Manual actions the user must take.
7. Whether the next phase is unblocked.

## Default pause conditions

Stop the phase and ask for user input only when a genuine decision blocks safe progress (for example, a conflicting graduation date or requested production permission). Otherwise make a best-effort implementation within scope and document uncertainty rather than asking questions already answered by these files.
