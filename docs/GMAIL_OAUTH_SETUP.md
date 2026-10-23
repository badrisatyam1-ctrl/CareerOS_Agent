# Gmail OAuth Setup & Permissions Guide

This document describes how to configure Google Cloud Console OAuth 2.0 credentials for CareerOS Gmail recruiter outreach.

> **CRITICAL SECURITY RULE:**  
> **Never paste your Google Client Secret, refresh token, or credentials into chat, issue descriptions, code comments, or Git commits.**

---

## 1. Google Cloud Console Setup

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project (e.g., `careeros-badri`).
3. Enable the **Gmail API**:
   - Go to **APIs & Services** → **Library**.
   - Search for **Gmail API** and click **Enable**.

---

## 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**.
2. Select **External** (or Internal if using Google Workspace).
3. Fill in required application details:
   - **App name:** `CareerOS`
   - **User support email:** Your personal email
   - **Developer contact information:** Your personal email
4. Under **Scopes**, click **Add or Remove Scopes** and add:
   - `https://www.googleapis.com/auth/gmail.compose` (Allows creating and managing email drafts)
   - `https://www.googleapis.com/auth/gmail.send` (Allows transmitting approved messages — required only when send capability is enabled)
   - `https://www.googleapis.com/auth/gmail.readonly` (Allows detecting replies to threads for follow-up reminders)
5. Under **Test Users**, add your personal Gmail address (`badri.demo@gmail.com` or your personal Google account).

---

## 3. Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**.
2. Click **Create Credentials** → **OAuth client ID**.
3. Choose **Web application**:
   - **Name:** `CareerOS Local Client`
   - **Authorized JavaScript origins:** `http://localhost:3000`
   - **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`
4. Click **Create**.
5. Copy your **Client ID** and **Client Secret**.

---

## 4. Local Environment Configuration

Add the credentials to your local `.env` file (which is strictly excluded from Git in `.gitignore`):

```bash
# Google / Gmail OAuth 2.0 Credentials (NEVER COMMIT TO GIT)
GMAIL_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="your-google-client-secret"
GMAIL_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"
```

---

## 5. Security & Operating Policies

1. **Draft-Only First:** By default, CareerOS initializes Gmail integration in draft-only mode (`w_member_social` equivalent: `gmail.compose`). Messages are written directly to your Gmail Drafts folder for manual review.
2. **Action-Specific Send Gate (§6):** When send capability is explicitly activated, no email is ever transmitted without a distinct, human-authorized approval token bound to the SHA-256 content hash of the message and attachment.
3. **Audit Privacy:** Outbound communications log only the Gmail Message ID, timestamp, recipient domain, and attachment checksum. Message bodies and private recruiter contact details are never written to application logs.
4. **Token Encryption:** Refresh tokens are encrypted with AES-256-GCM using a server-side encryption key prior to storage in PostgreSQL.
