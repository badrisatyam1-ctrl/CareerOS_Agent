# CareerOS — Backup, Retention, and Data Deletion Procedures

This guide provides procedures for backing up data, rotating encryption keys, and executing complete data deletion or export for Badri Vishal Pandey.

---

## 1. Backup Procedures

### PostgreSQL Database Dump
To create a complete snapshot of all CareerOS tables (evidence vault, job applications, audit events, outreach history):

```bash
# Dump the postgres database to a compressed SQL archive
docker exec -t careeros-postgres pg_dump -U careeros -d careeros -F c -b -v -f /tmp/careeros_backup.dump

# Copy the backup archive to a secure local destination
docker cp careeros-postgres:/tmp/careeros_backup.dump ./backups/careeros_backup_$(date +%Y%m%d).dump
```

### Encryption Key Safeguards
The `TOKEN_ENCRYPTION_KEY` is required to decrypt any OAuth refresh tokens stored in the database.
- Store your `TOKEN_ENCRYPTION_KEY` in a secure password manager (e.g., 1Password, Bitwarden).
- If the encryption key is lost, stored OAuth tokens cannot be decrypted and must be re-authenticated.

---

## 2. Retention Policies

| Entity | Retention Period | Purge Action |
|---|---|---|
| **Audit Events** | 90 days | Old events pruned or archived; sensitive fields redacted. |
| **Outreach Drafts** | 60 days | Expired/unapproved drafts deleted unless marked for follow-up. |
| **Sandbox Execution Logs** | 14 days | Stored test execution snippets pruned automatically. |
| **OAuth Access Tokens** | Lifetime of connection | Cleared immediately upon disconnect. |
| **Notification Center Alerts** | 30 days | Read notifications archived or deleted. |

---

## 3. Data Deletion & Account Disconnect Procedures

### Disconnecting Integrations
To disconnect an external account (GitHub, Google, LinkedIn) and wipe stored credentials:
1. Navigate to **Settings** (`/settings`).
2. Click **Disconnect** next to the provider.
3. CareerOS immediately:
   - Wipes encrypted access and refresh tokens from `ConnectedAccount`.
   - Halts active scheduled background tasks for that provider.
   - Records an immutable audit event (`DISCONNECT_EXECUTED`).

### Complete Local Purge (Factory Reset)
To delete all local data, cached postings, and reset the application to a clean slate:

```bash
# 1. Stop and remove the PostgreSQL Docker container and volumes
docker-compose down -v

# 2. Delete temporary sandbox directories and build caches
rm -rf .next scratch/sandbox node_modules/.cache

# 3. Restart container with fresh schema
docker-compose up -d
npx prisma db push
npm run db:seed
```
