# CareerOS — Local Setup and Developer Guide

This document describes how to run and test CareerOS locally in **Demo Mode** with zero external credentials or live provider connections.

---

## 1. Prerequisites

- **Node.js**: v18.18+ or v20+ (tested with v25)
- **NPM**: v9+ (or pnpm / yarn)
- **Docker** (recommended for local PostgreSQL) or an existing PostgreSQL instance

---

## 2. Quickstart (Under 2 Minutes)

### Step 1: Clone & Install Dependencies
```bash
# Navigate to workspace
cd CareerOS_Aget

# Install npm dependencies
npm install
```

### Step 2: Configure Environment
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Default `.env` settings:
```ini
DATABASE_URL="postgresql://careeros:careeros@localhost:5432/careeros?schema=public"
NODE_ENV="development"
NEXT_PUBLIC_APP_ENV="development"
NEXT_PUBLIC_DEMO_MODE="true"
TOKEN_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

### Step 3: Start Local PostgreSQL (Docker)
```bash
docker compose up -d
```
This starts PostgreSQL 16 on port 5432 with isolated credentials (`careeros`/`careeros`).

### Step 4: Run Database Migrations & Seed Demo Data
```bash
# Push Prisma schema to PostgreSQL
npm run db:push

# Seed isolated demo data across all 28 entities
npm run db:seed
```

### Step 5: Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Running Tests and Checks

CareerOS enforces a strict **Test-Before-Claim** policy (`AGENTS.md`):

```bash
# Run unit & integration test suite (Vitest)
npm run test

# Run TypeScript strict type-check
npm run type-check

# Run production build validation
npm run build
```

---

## 4. Key Architectural Safeguards

1. **Demo Mode Isolation (`NEXT_PUBLIC_DEMO_MODE="true"`)**:
   - The application runs completely offline without touching external APIs.
   - All email dispatches, LinkedIn posts, and git pushes are mocked and isolated.
2. **Consequential Action Approval Gate (§6)**:
   - External operations (sending emails, pushing branches, publishing content) require an explicit, action-specific approval from the user immediately before execution.
   - Approvals are locked with a 64-character SHA-256 content hash and a 30-minute time-to-live.
3. **Sensitive Data Protection**:
   - All tokens are encrypted at rest using AES-256-GCM.
   - Structured logging redacts secrets, tokens, and PII automatically.
   - Resumes and private documents are stored in gitignored private storage, never in public web roots.
