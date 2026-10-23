# CareerOS — Technical Architecture

**Architecture style:** modular monolith with provider adapters and an isolated contribution worker.  
**Primary goal:** maintainable for one engineering student while retaining clear trust boundaries.

## 1. Proposed stack

- **Application:** Next.js App Router, TypeScript, React.
- **UI:** Tailwind CSS plus accessible component primitives; use a consistent component library rather than hand-rolling inaccessible controls.
- **Validation:** Zod (or one equivalent typed schema library) at every external boundary.
- **Database:** PostgreSQL with Prisma ORM and versioned migrations.
- **Authentication:** secure single-user application authentication; use an established Auth.js-compatible approach or equivalent. Require server-side authorization for every private operation.
- **Background tasks:** start with a database-backed queue/scheduler adapter where possible. Introduce Redis/BullMQ only when a demonstrated workload justifies a separate broker. Do not use in-memory timers as durable scheduling.
- **AI providers:** provider-neutral interface for the selected model; keep keys server-side, add timeout/token budgets, and support mock mode.
- **Search/data sources:** separate adapters for official APIs and permitted public feeds. Store source URL, timestamps, and collection method.
- **Email:** official Gmail API using OAuth. Initial mode is draft-only.
- **GitHub:** official GitHub REST/GraphQL API as needed, least-privilege OAuth/App permissions, rate-limit awareness.
- **LinkedIn:** only authorized, permitted official API operations if the user has access; otherwise drafts and manual handoff.
- **Testing:** unit tests, integration tests with mock providers, end-to-end tests for approval boundaries, lint, formatting, type checks, and secret/dependency scans.

The exact package versions must be selected at implementation time and pinned in the lockfile. Antigravity must check current framework/API compatibility rather than assume versions from this document.

## 2. High-level component diagram

```text
Browser UI
   │ HTTPS / authenticated session
   ▼
Next.js route handlers / server actions
   │
   ├── Domain services ─── Evidence vault + rules engine
   │       │                       │
   │       ├── Job discovery/matching
   │       ├── LinkedIn content/networking
   │       ├── Gmail drafting/outreach
   │       ├── GitHub repository/issue intelligence
   │       ├── Contribution planning/review
   │       └── Interview/weekly review
   │
   ├── Approval service ─── Audit/event ledger
   │
   ├── Provider adapters
   │       ├── GitHub API
   │       ├── Gmail API
   │       ├── permitted job/search sources
   │       ├── optional permitted LinkedIn API
   │       └── AI model provider
   │
   ▼
PostgreSQL + encrypted integration credentials
   │
   └── Durable task queue / worker
             ├── refresh public source data
             ├── schedule reminders/reports
             └── prepare isolated contribution workspaces
```

**Trust boundary:** the main web application must not execute arbitrary code found in external repositories. Contribution preparation runs in a separate restricted workspace/worker with no access to application secrets or production credentials.

## 3. Repository layout

```text
career-os-agent/
├── AGENTS.md
├── README.md
├── .env.example                 # placeholders only
├── .gitignore
├── docs/
│   ├── prd.md
│   ├── architecture.md
│   ├── rules.md
│   ├── design.md
│   ├── security.md
│   ├── data_model.md
│   ├── implementation_plan.md
│   ├── OPEN_QUESTIONS.md
│   ├── PUBLIC_PROFILE_AUDIT.md  # created during Phase 0
│   └── implementation_log.md   # maintained during implementation
├── .agents/
│   └── skills/
│       ├── linkedin-content/SKILL.md
│       ├── career-networking/SKILL.md
│       ├── job-discovery/SKILL.md
│       ├── resume-tailoring/SKILL.md
│       ├── github-issue-triage/SKILL.md
│       ├── github-contribution/SKILL.md
│       └── weekly-review/SKILL.md
├── src/
│   ├── app/                     # routes and layouts
│   ├── components/              # reusable UI
│   ├── modules/                 # domain modules by capability
│   ├── lib/                     # db, auth, validation, logging
│   ├── integrations/            # provider adapters
│   ├── jobs/                    # durable tasks and worker entrypoints
│   └── types/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                  # fake/demo data only
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/                # fake/sanitized data only
└── private-data/                # local-only if needed; always gitignored
```

Do not create `private-data/` as a public/static web directory. Prefer OS-protected storage or a managed object store for private files.

## 4. Domain modules

### Profile and evidence

Owns career preferences, profile facts, verified source records, conflict resolution, role preferences, resume versions, and facts available to generation tools.

### Job discovery

Owns source adapters, normalized listings, deduplication, freshness, eligibility checks, explainable match scores, and application status transitions.

### Networking and outreach

Owns public-source lead records, relevance reasons, contact provenance, do-not-contact/opt-out state, drafts, per-recipient approval, send idempotency, reply/follow-up status, and audit events.

### LinkedIn studio

Owns content ideas/drafts, source evidence, voice preferences, duplicate-theme detection, approval state, and a publisher adapter that is disabled unless supported permissions are explicitly configured.

### GitHub lab

Owns repositories, forks, watchlists, issue candidates, repository guidelines, contribution plans, sandbox references, test outcomes, diffs, PR metadata, and remote-action approvals.

### Interview and learning

Owns job-to-skill matrices, knowledge gaps, practice plans, question sets, study sessions, and interview outcomes.

### Operations

Owns scheduler, queues, notifications, idempotency keys, run history, pause-all, health status, audit, error handling, and retention jobs.

## 5. Integration interface pattern

Every provider adapter should expose typed operations with explicit capabilities rather than a generic arbitrary-action method. Example capability concepts:

- `searchListings`, `getListing`, `getSourceHealth`
- `listRepositories`, `listIssues`, `getIssue`, `getPullRequest`, `openPullRequest` (the last operation only behind approval)
- `createEmailDraft`, `sendApprovedEmail`
- `createLinkedInDraft`, `publishApprovedPost` (only when permitted official API access is available)
- `generateStructuredOutput`

Each call should return structured data including provider, request ID where available, fetched timestamp, rate-limit state, source URL, and a normalized error type. Use mock adapters for tests and initial demo mode. Do not let UI components call providers directly.

## 6. Core data flow

1. A user-triggered or scheduled refresh requests data through a source adapter.
2. Validate provider output, normalize URLs, remove duplicates, record source and timestamp, and store only fields needed for the feature.
3. The domain service evaluates records against editable profile preferences and produces explainable recommendations.
4. Generation receives a constrained evidence packet—not the user's entire mailbox or all stored data—and returns schema-validated drafts.
5. The UI shows sources, reasons, uncertainties, proposed action, and required permissions.
6. On user approval, the server revalidates the target, permissions, opt-out/pause state, duplicate key, and the exact draft/diff hash.
7. The action adapter performs the one approved operation and records the provider response in the audit ledger.
8. Scheduled reporting reads actual status events, never infers that a draft became an executed action.

## 7. API and service boundaries

- Keep provider calls server-side.
- Use typed internal service methods; validate every route body and query.
- Protect all private routes with authentication and server-side authorization.
- Use pagination and bounded result sizes for API listing endpoints.
- Apply request timeouts, retries with exponential backoff and jitter for retryable errors, and no blind retry for non-idempotent writes.
- Attach an idempotency key to sends and PR-open operations wherever provider support permits; otherwise perform a database-side preflight and persist the result.
- Use optimistic concurrency or a draft/version hash so approvals cannot authorize a draft that changed after review.

## 8. Job execution and scheduling

Use a durable task record with `queued`, `running`, `succeeded`, `failed`, `cancelled`, or `needs_review` states; `runAfter`, attempt count, deduplication key, last error category, and timestamps. Workers should have bounded concurrency, timeouts, retry policies, and observable last-success markers. All times are stored in UTC and presented using Asia/Kolkata by default. Never let a scheduled job bypass the approval service.

For the first local milestone, scheduled execution may be disabled and manual refresh buttons can call the same service paths. Add durable scheduling only after the application is stable.

## 9. Deployment and local development

- Local development: app + PostgreSQL, mock providers, and seed data. Avoid requiring production OAuth just to open the dashboard.
- Staging: isolated database, mock/live-read-only provider credentials, explicit environment banner, no real send/publish/push actions by default.
- Production: TLS, managed PostgreSQL, encrypted secrets/token storage, backups, server-side auth, health checks, structured redacted logs, dependency scanning, and documented restore/deletion procedures.
- Never deploy or connect accounts automatically as part of an Antigravity build phase.

## 10. Architectural decisions to preserve

- Build a modular monolith first, not microservices.
- Keep provider-specific logic behind adapters.
- Keep the evidence store separate from untrusted model output.
- Keep remote writes behind the approval service.
- Keep contribution code execution outside the primary web process.
- Use mocks to test failures, rate limits, revoked permissions, and approval enforcement.
- Add extra infrastructure only when a measured requirement justifies it.
