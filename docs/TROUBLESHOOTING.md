# CareerOS — Operations & Troubleshooting Guide

This guide provides diagnosis and resolution steps for common technical issues encountered while running CareerOS.

---

## 1. Database Connection & Migration Errors

### Symptom: `Can't reach database server at localhost:5432`
- **Cause:** The PostgreSQL Docker container is not running or port 5432 is occupied.
- **Resolution:**
  ```bash
  # Check if postgres container is running
  docker ps -a --filter "name=careeros-postgres"

  # If stopped, restart the container:
  docker start careeros-postgres

  # If not created, start via docker-compose:
  docker-compose up -d

  # Verify connection with Prisma:
  npx prisma db push
  ```

### Symptom: `Foreign key constraint violated: AuditEvent_userId_fkey`
- **Cause:** Creating an audit event referencing a `userId` that does not exist in `UserProfile`.
- **Resolution:**
  Ensure the database has been seeded with demo users:
  ```bash
  npm run db:seed
  ```

---

## 2. Token Encryption Key Errors

### Symptom: `TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)`
- **Cause:** The `TOKEN_ENCRYPTION_KEY` in `.env` is missing, too short, or not hex-encoded.
- **Resolution:**
  Generate a valid 32-byte key:
  ```bash
  # Linux / macOS / Git Bash:
  openssl rand -hex 32

  # PowerShell:
  -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
  ```
  Paste the resulting 64-character string into `.env` as `TOKEN_ENCRYPTION_KEY`.

---

## 3. Scheduler & Task Cooldown Window

### Symptom: `Idempotency guard: task ran recently. Cooldown active for next Ns.`
- **Cause:** Tasks enforce a 60-second cooldown window to prevent rapid duplicate executions or rate-limit exhaustion.
- **Resolution:**
  - Wait 60 seconds for the cooldown to expire, OR
  - Click **Run Now** in `/activity` (which triggers a forced manual execution with `forceRun = true`).

### Symptom: Task execution returns `BLOCKED_PAUSED`
- **Cause:** The master "Pause All" switch is enabled.
- **Resolution:**
  Navigate to `/activity` or `/settings` and toggle **Resume All Schedules**.

---

## 4. Prompt Injection & Security Alerts

### Symptom: `Potential prompt injection / override attempt detected`
- **Cause:** Untrusted text in a job description, issue body, or comment contained instructions attempting to override system rules (e.g. `ignore previous instructions`, `bypass approval gate`).
- **Resolution:**
  This is expected defensive behavior. CareerOS treats the untrusted text as passive data, blocks execution of embedded instructions, and records a security notice in `/activity`.

---

## 5. Next.js Dev Server / Build Issues

### Symptom: Port 3000 in use (`EADDRINUSE`)
- **Resolution:**
  ```powershell
  # Find process using port 3000
  netstat -ano | findstr :3000
  # Stop the process
  Stop-Process -Id <PID> -Force
  ```

### Symptom: Stale Next.js cache
- **Resolution:**
  ```bash
  rm -rf .next
  npm run build
  ```
