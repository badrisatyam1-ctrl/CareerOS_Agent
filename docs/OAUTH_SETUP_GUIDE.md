# CareerOS — OAuth Setup & Credential Configuration Guide

This guide describes how to configure official OAuth integrations for **GitHub**, **Google / Gmail**, and **LinkedIn** for CareerOS.

---

## Security Principles & Least Privilege
1. **Never commit real credentials to Git.** Keep `.env` gitignored and place client secrets in your local `.env` only.
2. **Read-only by default.** All integrations start in read-only / draft-only mode.
3. **Encrypted storage.** Tokens are stored using AES-256-GCM encryption at rest via `TOKEN_ENCRYPTION_KEY`.
4. **Action-specific human gates.** External writes (sending email, pushing git branches, creating PRs) require explicit, per-action user approval immediately before execution.

---

## 1. GitHub Integration (GitHub App / OAuth)

### Preferred Approach: GitHub App
A GitHub App provides fine-grained repository permissions and explicit installation controls.

1. Navigate to **GitHub Settings** $\to$ **Developer settings** $\to$ **GitHub Apps** $\to$ **New GitHub App**.
2. Set **App name**: `CareerOS-Badri` (or similar unique name).
3. Set **Homepage URL**: `http://localhost:3000`.
4. Set **Callback URL**: `http://localhost:3000/api/auth/callback/github`.
5. Uncheck **Webhook Active** (webhooks are not required for local operations).
6. Configure **Permissions**:
   - **Repository permissions:**
     - *Contents:* Read-only (default). Request Write only for the isolated contribution workbench.
     - *Issues:* Read-only.
     - *Pull requests:* Read & Write (only exercised after dual approval).
     - *Metadata:* Read-only.
7. Generate and download a **Private Key** (`.pem`) and copy the **Client ID** and **Client Secret**.
8. In `.env`:
   ```bash
   GITHUB_CLIENT_ID="your_github_client_id"
   GITHUB_CLIENT_SECRET="your_github_client_secret"
   GITHUB_REDIRECT_URI="http://localhost:3000/api/auth/callback/github"
   ```

---

## 2. Google / Gmail API Integration

### Setup Steps in Google Cloud Console
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project: `CareerOS-Personal`.
3. Enable the **Gmail API**:
   - Navigate to **APIs & Services** $\to$ **Library**.
   - Search for **Gmail API** and click **Enable**.
4. Configure the **OAuth Consent Screen**:
   - User Type: **External** (in Testing mode).
   - Add Test User: Your personal Gmail address.
   - Authorized domain: `localhost`.
5. Create Credentials:
   - Navigate to **Credentials** $\to$ **Create Credentials** $\to$ **OAuth client ID**.
   - Application type: **Web application**.
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`.
6. Configure Scopes:
   - Start with draft-only: `https://www.googleapis.com/auth/gmail.compose`
   - Outreach delivery (send): `https://www.googleapis.com/auth/gmail.send` (Requires user send confirmation).
7. In `.env`:
   ```bash
   GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"
   ```

---

## 3. LinkedIn Integration (Official APIs or Manual Handoff)

### Policy Posture
- CareerOS strictly prohibits unofficial scraping, headless browser automation, or bot extensions.
- When official LinkedIn Share API credentials are not available, CareerOS defaults to **Manual Handoff Mode**:
  1. The agent drafts evidence-backed content.
  2. The user reviews and approves the draft.
  3. The user clicks **Copy Content** and posts manually to [linkedin.com/feed](https://www.linkedin.com/feed/?shareActive=true).
- If configured via the official LinkedIn Developer Portal:
  - Required scope: `w_member_social` (requires developer review).
  - In `.env`:
    ```bash
    LINKEDIN_CLIENT_ID="your_linkedin_client_id"
    LINKEDIN_CLIENT_SECRET="your_linkedin_client_secret"
    LINKEDIN_REDIRECT_URI="http://localhost:3000/api/auth/callback/linkedin"
    ```

---

## 4. Token Revocation & Disconnect Flow
Every connected integration can be revoked directly in the **Settings** view (`/settings`):
- Clicking **Disconnect** wipes encrypted tokens from the database.
- Stops all dependent scheduled background tasks.
- Emits an append-only audit event in the security trail.
