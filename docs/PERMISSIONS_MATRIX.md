# CareerOS — Permissions, Scopes & Approval Gates Matrix

This document defines the exact permission model, API scopes, and mandatory human approval gates for CareerOS.

---

## 1. Action Permission Matrix

| Module / Operation | Default Posture | Provider Scopes Required | Human Approval Gate (§6) | Consequence / Audit Trail |
|---|---|---|---|---|
| **Public Job Discovery** | Active | None (Public ATS endpoints: Greenhouse, Lever) | None | Logs scraped URL, deduplication hash, timestamp. Zero writes. |
| **Resume Tailoring** | Active | None (Internal evidence vault) | None | Zero-fabrication check; outputs tailored Markdown and diff. |
| **GitHub Read Discovery** | Read-Only | `repo:read`, `read:user` | None | Discovers owned repos, forks, and issues with ETag caching. |
| **Sandbox Test Execution** | Active | None (Isolated child process) | None | Executes local tests in clean worktree; scrubs all app secrets. |
| **Git Push to Remote** | **BLOCKED** | `repo` (Write) | **MANDATORY**: Single-action approval bound to diff hash | Pushes feature branch to remote fork. Main branch writes prohibited. |
| **Open GitHub Pull Request** | **BLOCKED** | `pull_requests:write` | **MANDATORY**: Action-specific approval with diff preview | Opens public PR with conventional commit title and issue link. |
| **LinkedIn Draft Creation** | Active | None (Evidence-backed templates) | None | Prepares 3 rotating candidate drafts with verified source links. |
| **LinkedIn Publishing** | **MANUAL** | `w_member_social` (if connected) | **MANDATORY**: Content hash approval token | Defaults to clipboard copy; never uses unauthorized scraping bots. |
| **Gmail Draft Preparation** | Active | `gmail.compose` | None | Prepares one-to-one message with attachment preview. |
| **Gmail Outreach Delivery** | **BLOCKED** | `gmail.send` | **MANDATORY**: Action-specific approval with recipient/body preview | Sends email via Gmail API; enforces 5/day limit and opt-out checks. |
| **Automated Scheduler** | Active | Internal task runner (Asia/Kolkata) | Subject to underlying action gates | Refreshes caches and drafts; scheduler cannot approve external writes. |
| **Account Disconnect** | On-Demand | Internal DB mutation | User confirmation in UI | Wipes encrypted tokens, clears credentials, logs audit event. |

---

## 2. Server-Side Approval Token Enforcement (§6)

External write paths (such as `executeApprovedPush`, `executeApprovedOpenPr`, and `sendApprovedOutreach`) enforce cryptographic content-locking:

1. **Content Hash Binding:** The approval request stores `SHA-256(payload)`. Any modification to the diff or message text invalidates authorization.
2. **Short TTL:** Approval tokens expire automatically after 30 minutes.
3. **Master Pause Check:** If the master scheduler switch is set to `PAUSED`, automated operations are halted.
4. **Audit Logging:** Every approval request, acceptance, decline, and execution is recorded with redacted details.
