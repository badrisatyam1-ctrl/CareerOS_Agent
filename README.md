# CareerOS — Single-User Career Operations & Open-Source Contribution Assistant

CareerOS is an autonomous career operations and open-source contribution workbench designed specifically for **Badri Vishal Pandey** (B.Tech CSE, Class of 2027). It centralizes job radar discovery, evidence-backed LinkedIn content drafting, one-to-one recruiter outreach, GitHub contribution intelligence, interview prep with source-verified claims, and weekly operations reporting into a dashboard—while strictly keeping every consequential external action under explicit, per-action human approval.

---

## Core Principles

1. **Evidence Before Claims:** Every professional statement, resume bullet point, and LinkedIn draft must trace back to a verified fact in the Career Evidence Vault. Unsupported claims are omitted or flagged.
2. **Human Control for Consequential Actions:** External communications (sending email, publishing posts, pushing git commits, opening PRs) require action-specific user approvals bound to cryptographic content hashes. Default posture is draft/preview only.
3. **Quality Over Volume:** Focuses on meaningful open-source contributions, high-fit engineering roles, and personalized recruiter connections. Vanity metrics, spam blasts, and automated connection botting are forbidden.
4. **Honest Status Accountability:** Strictly distinguishes `SUGGESTED`, `DRAFTED`, `APPROVED`, `EXECUTED`, and `VERIFIED OUTCOME`. Unsent drafts are never counted as applications; proposed PRs are never counted as contributions.
5. **Privacy by Default:** Zero secrets, private resumes, or credentials in Git, build bundles, or ordinary logs. Sensitive tokens are encrypted at rest with AES-256-GCM.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 (App Router), React 18, TypeScript (Strict Mode) | Modular monolith with Server Components and Client Views |
| **Styling & Icons** | Tailwind CSS + Lucide React | Accessible, WCAG AA compliant dark-mode UI |
| **Database & ORM** | PostgreSQL 16 + Prisma ORM | 28 normalized models, versioned migrations, relational integrity |
| **Security & Crypto** | Node.js `crypto` (AES-256-GCM, SHA-256) + Next.js Middleware | Token encryption at rest, CSRF origin guards, CSP headers |
| **Quality & Tests** | Vitest + TypeScript (`tsc --noEmit`) | 164 automated tests across 18 test suites (unit, integration, adversarial) |
| **Integration Adapters** | Provider-neutral adapters (GitHub, Gmail, LinkedIn, AI) | Safe mock adapters for isolated development with fault simulation |

---

## Functional Dashboard Modules

- **Overview (`/`):** High-level operational radar, daily priorities, quick approval queue, and recent audit activity.
- **GitHub Lab (`/github`):** Read-only repository inspection (owned, forks, starred, active), trending language explorer, and explainable 100-point issue suitability rubric.
- **Contribution Workbench (`/contributions`):** Isolated sandbox workbench with pre-coding inspection, dangerous script scanning, diff secret auditing, and dual approval gates (`GIT_PUSH` $\to$ `OPEN_PR`).
- **LinkedIn Studio (`/linkedin`):** 3-draft weekly rotating plan (Build Logs, Debugging Trade-offs, DSA Lessons) grounded in verified evidence, anti-spam quality scoring, and manual copy handoff.
- **Career Networking (`/network`):** Verified engineering leads from public conference talks and team pages, ranked relevance scoring, 300-char LinkedIn connection notes, and 60-day deduplication.
- **Job Discovery Radar (`/jobs`):** Official ATS postings (Greenhouse, Lever), explainable fit scoring, graduation mismatch sentinels, and hard blockers vs. soft gaps analysis.
- **Recruiter Outreach (`/outreach`):** One-to-one Gmail drafts, resume attachment checksum previews, 5/day sending limit, 7-day follow-up rules engine, and content-locked approval tokens.
- **Interview & Evidence Vault (`/interview`):** Derived skill matrices, milestone-driven 4-week study plans, verified STAR stories, and an interactive real-time claim verifier.
- **Activity & Operations Center (`/activity`):** Asia/Kolkata timezone scheduler matrix, master "Pause All" switch, weekly operations briefing, secret-redacted notification center, and immutable security audit log.
- **Settings & Integration Status (`/settings`):** Profile preferences, confirmed 2027 graduation year, provider connection status, least-privilege permission matrix, and disconnect/purge controls.

---

## Quickstart & Local Installation

### Prerequisites
- Node.js 18.x or 20.x
- Docker & Docker Compose (for PostgreSQL)
- Git

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/badrisatyam1-ctrl/CareerOS_Aget.git
cd CareerOS_Aget
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Generate secure random encryption and authentication keys:
```bash
# Generate 32-byte hex encryption key for AES-256-GCM:
openssl rand -hex 32
# Paste into .env as TOKEN_ENCRYPTION_KEY

# Generate random string for AUTH_SECRET:
openssl rand -base64 32
# Paste into .env as AUTH_SECRET
```

### 3. Start PostgreSQL Container
```bash
docker-compose up -d
```
Verify the container is healthy:
```bash
docker ps --filter "name=careeros-postgres"
```

### 4. Apply Database Migrations & Seed Demo Data
```bash
npx prisma db push
npm run db:seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Test Commands

CareerOS adheres to a strict **Test-Before-Claim** policy. Run the complete automated test suite before any staging or production release:

```bash
# 1. Run all 164 unit, integration, and adversarial tests:
npm run test

# 2. Run TypeScript compiler strict type check:
npm run type-check

# 3. Create optimized Next.js 14 production build:
npm run build

# 4. Check database schema integrity:
npx prisma validate
```

### Adversarial Abuse-Case Test Suite
The adversarial suite (`tests/unit/adversarial_abuse_cases.test.ts`) tests 11 critical failure modes:
- Malicious issue prompts secret exfiltration $\to$ Detected, command blocked, diff secrets caught.
- Job post contains prompt injection to bypass approvals $\to$ Detected, data encapsulated, zero auto-submit.
- Email recipient is guessed $\to$ Blocked due to missing public source provenance.
- Duplicate application ingestion $\to$ Deduplicated by canonical URL and role title.
- Revoked OAuth token $\to$ Fails safely with structured `REVOKED_ACCESS` error.
- GitHub API 429 rate limit $\to$ Handles retryable status with backoff awareness.
- Sandbox tests fail during contribution flow $\to$ Non-zero exit code caught, blocks push approval.
- Unapproved PR submission attempt $\to$ Rejected with `Approval record not found`.
- LinkedIn API access unavailable $\to$ Safe fallback to manual copy handoff.
- Scheduled action runs while scheduler is paused $\to$ Blocked immediately with `BLOCKED_PAUSED`.
- SSRF attempts against cloud metadata & loopback $\to$ Blocked by SSRF guard.

---

## Reference Documentation

- [docs/OAUTH_SETUP_GUIDE.md](file:///c:/Users/badri/Desktop/CareerOS_Aget/docs/OAUTH_SETUP_GUIDE.md) — Step-by-step setup for GitHub Apps, Google/Gmail OAuth, and LinkedIn APIs.
- [docs/PERMISSIONS_MATRIX.md](file:///c:/Users/badri/Desktop/CareerOS_Aget/docs/PERMISSIONS_MATRIX.md) — Permission scopes, provider capabilities, and human approval gates.
- [docs/TROUBLESHOOTING.md](file:///c:/Users/badri/Desktop/CareerOS_Aget/docs/TROUBLESHOOTING.md) — Resolution steps for database connections, encryption errors, and cooldowns.
- [docs/BACKUP_AND_DELETION.md](file:///c:/Users/badri/Desktop/CareerOS_Aget/docs/BACKUP_AND_DELETION.md) — PostgreSQL database dumps, token rotation, and complete data purge procedures.
- [docs/PUBLIC_PROFILE_AUDIT.md](file:///c:/Users/badri/Desktop/CareerOS_Aget/docs/PUBLIC_PROFILE_AUDIT.md) — Public profile audit and graduation discrepancy reconciliation notes.
- [docs/implementation_log.md](file:///c:/Users/badri/Desktop/CareerOS_Aget/docs/implementation_log.md) — Chronological execution log across all 12 implementation phases.

---

## Production Deployment Steps (Self-Hosted)

1. **Host Environment:** Deploy on a secure Linux VPS (Ubuntu 22.04 LTS / Debian 12) or managed container environment (Docker / Railway / Fly.io).
2. **Reverse Proxy & SSL:** Configure Nginx or Caddy with automated Let's Encrypt SSL/TLS certificates pointing to `localhost:3000`.
3. **Environment Variables:**
   - Set `NODE_ENV="production"`.
   - Set `NEXT_PUBLIC_APP_ENV="production"`.
   - Set `NEXT_PUBLIC_DEMO_MODE="false"`.
   - Supply production PostgreSQL connection string in `DATABASE_URL`.
   - Supply 32-byte hex string in `TOKEN_ENCRYPTION_KEY`.
   - Supply random 32-character string in `AUTH_SECRET`.
4. **Build & Start Service:**
   ```bash
   npm run build
   npm run start
   ```
   (Or manage the service via `pm2` / `systemd`).

---

## Remaining Limitations & Future Roadmap

1. **LinkedIn Official Publishing:** Currently operates exclusively via **Manual Copy Handoff** because LinkedIn requires an approved Developer Enterprise app for automated member posting. This ensures zero risk of account restriction.
2. **Isolated Sandbox Workspaces:** Current sandbox executes commands in a local isolated directory (`scratch/sandbox`). In high-concurrency multi-user production, this should be upgraded to ephemeral Docker containers or gVisor sandboxes.
3. **ATS Application Form Automation:** CareerOS does not perform automated browser clicks on Greenhouse/Lever application forms; it prepares the tailored resume and outreach email for manual submission. This complies with anti-bot policies and ensures human oversight.
4. **Single-User Scope:** The application is architected specifically for Badri Vishal Pandey. Multi-tenant team collaboration is out of scope by design.
