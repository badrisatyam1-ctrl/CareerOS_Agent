# CareerOS — Security, Privacy, and External-Action Policy

## 1. Security objectives

Protect the user's identity, resume, accounts, email, code, and reputation. Prevent prompt injection from turning an information-gathering agent into an unauthorized sender, publisher, or code executor. Make high-impact actions reviewable and recoverable.

## 2. Data classification

- **Public:** public repository metadata, public job postings, public professional profile data legitimately accessible for this purpose.
- **Personal:** career preferences, contact history, application stages, private notes, interview practice.
- **Sensitive:** resume PDF, private messages, personal email addresses, OAuth credentials, tokens, application documents, private repository content.
- **Secrets:** API keys, OAuth client secrets, access/refresh tokens, session-signing keys, encryption keys.

Store only what the feature needs. Sensitive and secret data must never be written to client bundles, static public assets, logs, generated screenshots, or Git.

## 3. Action permission matrix

| Operation | Default | Permission/approval required | Required gate |
|---|---|---|---|
| Read public job data | On when source is permitted | Source/API permission | Source and timestamp recorded |
| Read GitHub repositories/issues | Off until connected; read-only first | GitHub OAuth/App scope | Connected account + scopes + rate-limit check |
| Prepare local code patch | On for selected issue in sandbox | Isolated workspace capability | Inspect scripts; no secrets in sandbox |
| Push branch/open PR | Off | Write-capable GitHub permission | Per-action approval bound to exact diff and target |
| Generate LinkedIn draft | On | Evidence-backed profile context | Claim/evidence review |
| Publish LinkedIn post | Off | Permitted official API access if available | Per-post approval and capability check; otherwise manual handoff |
| Recommend connection/message | On | Legitimate public/provided data | Rationale and source shown |
| Send LinkedIn invite/DM or automate engagement | Prohibited in the default design | No browser-workaround fallback | Manual user action only unless a permitted official capability is explicitly supported |
| Create Gmail draft | On after OAuth or local draft mode | Gmail draft scope if API is used | Recipient/source/content preview |
| Send Gmail email | Off | Gmail send capability | Per-message confirmation, verified recipient/source, duplicate and opt-out checks |
| Attach resume | Off until a specific file is selected | Private file access | Exact filename preview and allowed file type |
| Run scheduled refresh | Opt-in | Source access | Durable job state, rate limits, pause flag |
| Scheduled external write | Off | Relevant provider permission | Must still require the same per-action approval; scheduler cannot approve itself |

## 4. Authentication and session security

- Require an authenticated user session for all dashboard data and mutations.
- Enforce authorization on the server, including route handlers, server actions, download endpoints, jobs, and background workers.
- Use secure, HTTP-only, same-site cookies where applicable; protect OAuth state/PKCE and callback flows.
- Set secure headers, validate origins/CSRF as appropriate, rate-limit authentication and mutation endpoints, and rotate/revoke sessions on disconnect or security-sensitive changes.
- Avoid a hard-coded default password or demo login that can exist in production.

## 5. OAuth, tokens, and secrets

- Request the minimum provider scopes necessary for the enabled features. Keep read-only mode as the first integration milestone.
- Store OAuth refresh/access tokens encrypted at rest. Use a deployment secret/KMS service when available; document key rotation and recovery. Never use client-side encryption as the only control.
- Keep provider credentials server-side in environment variables or secret storage. Commit only placeholder variable names in `.env.example`.
- Never place tokens or private profile data in prompts to external LLM providers unless the data is necessary, authorized, and covered by the configured provider/privacy policy.
- Support disconnect and revocation: stop dependent jobs, clear or revoke local credentials, and mark data unavailable instead of retrying forever.

## 6. Approval service

All remote write paths must call one centralized approval service. An approval record should include:

- action type and target resource/provider;
- normalized target identifier;
- immutable content/diff version or cryptographic hash;
- evidence/preview snapshot or stable reference;
- requesting user and time created;
- approval state, approver, approved time, expiration, and execution result;
- revalidation results at the moment of execution.

Approval must expire after a configurable short period or any material target/content change. The executor re-checks identity, permissions, pause-all, deduplication, opt-out, target state, and current provider capability. UI visibility is not a security control; server-side enforcement is mandatory.

## 7. Prompt injection and untrusted content

Assume malicious instructions can appear in issue descriptions, README files, code comments, job listings, emails, PDFs, search results, and generated model output. Such content must never:

- override system/project rules or approval gates;
- request, view, or exfiltrate tokens/private files;
- change recipients, repository targets, permissions, or enabled integrations;
- cause arbitrary commands to run without inspection;
- induce the agent to weaken tests, disable security, or hide behavior from the user.

Use structured extraction, allowlisted tool capabilities, schema validation, bounded context, and explicit source labels. The agent must not pipe raw source text into a shell. For code tasks, inspect scripts and dependencies, use a disposable worktree/container, enforce network/resource restrictions when feasible, and expose only the minimum files required.

## 8. GitHub sandbox controls

- Use a disposable clone/worktree and isolated worker/container for repository commands.
- Never mount application secrets, the user's resume folder, browser profile, SSH agent, or production token into the workspace.
- Inspect lifecycle scripts, Makefiles, test scripts, Git hooks, Dockerfiles, and dependency installation changes before running them.
- Restrict file system scope, CPU/memory/time, concurrency, and network where feasible. Record executed commands and exit codes.
- Read/write only to the intended working copy. User-owned repository writes still require explicit approval.
- Do not automatically merge, force-push, or overwrite a remote branch.

## 9. Gmail abuse prevention

- Do not guess addresses. Prefer contact details published on an official company/recruitment page or provided directly by the user.
- Store source URL and the reason for contact. Respect unsubscribe/opt-out and do-not-contact states.
- Enforce configurable daily/weekly send limits and deduplicate on normalized recipient + job/campaign + content intent.
- Follow-ups remain drafts and require confirmation. Never send a follow-up if a reply, opt-out, rejection, closed role, or prior maximum follow-up is detected.
- Avoid mass mail merges. The product is for relevant one-to-one outreach, not unsolicited campaigns.
- Keep message bodies out of ordinary logs. Log only minimal IDs, status, timestamps, and redacted error categories.

## 10. LinkedIn policy posture

- Do not use unauthorized scraping, hidden endpoints, cookies copied from a browser, stealth automation, or UI macros to imitate a human.
- Use only official, currently permitted API capabilities that the user actually has access to. Re-check terms and permissions at implementation time.
- If publishing or another operation is not available by an authorized API, provide editable content and a manual handoff. Do not represent a draft as published.
- Do not automate invites, DMs, likes, comments, or endorsements through a browser workaround.

## 11. Web, file, and input safety

- Validate URL schemes and redirects; block loopback, link-local, private-network, cloud-metadata, and other sensitive IP ranges for server-side fetches unless explicitly required and controlled.
- Limit response size, MIME types, file size, timeouts, redirect count, and decompression ratios.
- Protect against SSRF, path traversal, XSS, SQL injection, CSRF, open redirects, ZIP bombs, and malicious PDF/document inputs.
- Sanitize HTML, escape rendered content, use parameterized ORM queries, and validate inputs/outputs with typed schemas.

## 12. Logging, retention, and user controls

- Keep structured audit events for actions and state transitions; redact secrets and unnecessary PII.
- Set configurable retention for provider snapshots, drafts, contact data, logs, and uploaded resumes.
- Offer export and deletion procedures. Deleting an integration should stop its tasks and remove tokens; deleting a document should remove storage copies and derived previews as documented.
- Make disconnect, pause-all, clear demo data, export data, and delete data discoverable in Settings.
- Notifications must not reveal tokens, full resume contents, private message text, or sensitive interview notes.

## 13. Required adversarial tests

At minimum test: injected issue asks for secret exfiltration; malicious job page asks to bypass approval; guessed recipient; duplicate email; opt-out contact; expired job; revoked OAuth token; insufficient scope; HTTP 403/429; stale approval; changed diff after approval; failing tests; scheduled job during pause-all; duplicate scheduler run; LinkedIn capability unavailable; untrusted script asks for environment variables; and attempted public deployment during staging. Every test must fail safely and explain the reason.

Security testing reduces risk; it does not prove the application is perfectly secure.
