# CareerOS — Provider Capability Matrix

This document defines the integration capabilities, permission scopes, safety boundaries, and fallback strategies for all external providers in CareerOS, in accordance with `security.md` §3 and `AGENTS.md`.

---

## 1. Provider Capabilities Summary

| Provider | Capability | Mode / Scope | Status | Safety Gate / Fallback |
|---|---|---|---|---|
| **GitHub** | Read owned & watched repos | `read:user`, `repo:status` | `supported` | Read-only discovery. No writes. |
| **GitHub** | Triage open-source issues | `public_repo` | `supported` | Evaluates public issues via explainable suitability rubric. |
| **GitHub** | Remote branch push & open PR | `repo` | `requires approval/access` | **Mandatory Approval Gate:** Requires action-specific approval bound to exact SHA-256 diff hash. Disabled by default. |
| **Gmail** | Compose personalized outreach | `gmail.compose` | `supported` | Draft-only mode. Saves to Gmail Drafts folder. |
| **Gmail** | Send approved outreach | `gmail.send` | `requires approval/access` | **Mandatory Approval Gate:** Requires explicit send confirmation, duplicate recipient check, and opt-out validation. |
| **LinkedIn** | Evidence-backed content drafting | Internal Vault | `supported` | Requires verified project artifact from evidence vault. Zero fabrication. |
| **LinkedIn** | Publish approved post | `w_member_social` | `manual fallback` | When official member social publishing scope is not granted, formats post for one-click manual copy-paste. |
| **LinkedIn** | Automated invitations, DMs, likes | None | `manual fallback` | **Prohibited:** No browser automation, scraping, or headless bot routines. Manual user action only. |
| **Job Search** | Query public company ATS boards | Public JSON/RSS | `supported` | Query legitimate public ATS endpoints (Ashby, Greenhouse, Lever) without scraping. |
| **AI Model** | Structured schema generation | Server-side API key | `supported` | Provider-neutral interface with bounded tokens, timeouts, and Zod validation. |

---

## 2. Authentication & Credential Security (§5)

1. **Encrypted Token Storage:**
   - All OAuth access and refresh tokens are encrypted at rest using **AES-256-GCM** with authenticated 96-bit initialization vectors and 128-bit authentication tags.
   - Database columns: `encryptedAccessToken`, `encryptedRefreshToken`, `tokenIv`, `tokenAuthTag`.
   - Plaintext credentials never touch client-side bundles, logs, or Git.

2. **CSRF State Protection:**
   - Every OAuth authorization flow generates a cryptographically random 64-hex-character state token.
   - Single-use consumption with a 10-minute time-to-live.
   - Provider mismatch or token reuse immediately aborts the callback.

3. **Redirect URI Allowlist:**
   - All callback URLs are validated against a strict server-side allowlist preventing open redirect vulnerabilities.

4. **Disconnect & Revocation:**
   - Disconnecting an account immediately wipes all encrypted tokens, IVs, and tags from the database (`UPDATE connectedAccount SET encryptedAccessToken = NULL ...`).
   - Marks connection state as `DISCONNECTED`.
   - Records an immutable `AuditEvent` entry in the database.

---

## 3. Failure Mode Matrix & Automated Test Coverage

| Failure Mode | HTTP Code | Normalized Error Code | System Behavior |
|---|---|---|---|
| **Expired Credentials** | 401 | `EXPIRED_CREDENTIALS` | Halts automated calls, alerts user to re-authenticate, non-retryable. |
| **Revoked Permissions** | 403 | `REVOKED_ACCESS` | Clears local cache, marks connection `REVOKED`, non-retryable. |
| **Insufficient Permissions** | 403 | `INSUFFICIENT_PERMISSIONS` | Blocks operation (e.g. attempting to push code or send email in read/draft-only mode). |
| **Diff / Content Tampering** | 409 | `APPROVAL_MISMATCH` | Aborts execution if payload content hash does not match approved hash. |
| **Provider Outage** | 500 / 502 / 503 | `PROVIDER_OUTAGE` | Logs redacted error, retries with exponential backoff if retryable. |
| **Rate Limited** | 429 | `RATE_LIMITED` | Reads `X-RateLimit-Reset` header, backs off automatically, serves cached results. |
