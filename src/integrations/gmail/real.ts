/**
 * CareerOS Real Gmail Adapter
 *
 * Uses the Google APIs (googleapis) package to interact with the Gmail API
 * through the user's stored encrypted OAuth access token.
 *
 * Integration mode enforcement:
 *  - REAL_CONNECTED_READ_ONLY: No operations (read-only has no Gmail reads)
 *  - REAL_DRAFT_ONLY: createEmailDraft only
 *  - REAL_APPROVAL_REQUIRED / REAL_WRITE_ENABLED: createEmailDraft + sendApprovedEmail
 *
 * All responses conform to ProviderResponse<T>.
 */

import { google } from "googleapis";
import {
  IGmailAdapter,
  GmailDraft,
  GmailSentResult,
  CreateDraftInput,
  SendEmailInput,
} from "./index";
import { ProviderResponse, ProviderError } from "../types";
import { type IntegrationMode, isWriteAllowed } from "../mode";
import { computeHash } from "@/lib/crypto";
import { logger } from "@/lib/logger";

export class RealGmailAdapter implements IGmailAdapter {
  private token: string;
  private mode: IntegrationMode;

  constructor(token: string, mode: IntegrationMode) {
    this.token = token;
    this.mode = mode;
  }

  private getAuth() {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    auth.setCredentials({ access_token: this.token });
    return auth;
  }

  private meta(): { provider: "GMAIL"; timestamp: string } {
    return { provider: "GMAIL", timestamp: new Date().toISOString() };
  }

  private handleError(err: unknown, endpoint: string): ProviderError {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("REAL_GMAIL", `API error on ${endpoint}: ${message}`);

    if (message.includes("401") || message.includes("invalid_grant")) {
      return { code: "EXPIRED_CREDENTIALS", message: `Gmail token expired: ${message}`, provider: "GMAIL", retryable: false, statusCode: 401 };
    }
    if (message.includes("403")) {
      return { code: "REVOKED_ACCESS", message: `Gmail access denied: ${message}`, provider: "GMAIL", retryable: false, statusCode: 403 };
    }
    if (message.includes("429")) {
      return { code: "RATE_LIMITED", message: `Gmail rate limit: ${message}`, provider: "GMAIL", retryable: true, statusCode: 429 };
    }
    return { code: "PROVIDER_OUTAGE", message, provider: "GMAIL", retryable: true, statusCode: 500 };
  }

  /**
   * Build a RFC 2822 email string.
   */
  private buildMimeMessage(to: string, subject: string, body: string): string {
    const lines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      "",
      body,
    ];
    return lines.join("\r\n");
  }

  /**
   * Base64url-encode a string for Gmail API payloads.
   */
  private base64url(str: string): string {
    return Buffer.from(str)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  async createEmailDraft(input: CreateDraftInput): Promise<ProviderResponse<GmailDraft>> {
    // Mode check: draft creation is allowed in DRAFT_ONLY and above
    if (this.mode === "REAL_CONNECTED_READ_ONLY") {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Draft creation blocked: Current mode is READ_ONLY. Upgrade to DRAFT_ONLY to create Gmail drafts.",
          provider: "GMAIL",
          retryable: false,
          statusCode: 403,
        },
        meta: this.meta(),
      };
    }

    try {
      const auth = this.getAuth();
      const gmail = google.gmail({ version: "v1", auth });

      const raw = this.base64url(this.buildMimeMessage(input.to, input.subject, input.body));

      const res = await gmail.users.drafts.create({
        userId: "me",
        requestBody: {
          message: { raw },
        },
      });

      const draftId = res.data.id || `draft-${Date.now()}`;
      const messageId = res.data.message?.id || `msg-${Date.now()}`;

      logger.info("REAL_GMAIL", `Draft created: ${draftId}`, { to: input.to, subject: input.subject });

      return {
        success: true,
        data: {
          id: draftId,
          messageId,
          to: input.to,
          subject: input.subject,
          body: input.body,
          hasResumeAttachment: !!input.attachResume,
          createdAt: new Date().toISOString(),
        },
        meta: this.meta(),
      };
    } catch (err) {
      return { success: false, error: this.handleError(err, "createEmailDraft"), meta: this.meta() };
    }
  }

  async sendApprovedEmail(input: SendEmailInput): Promise<ProviderResponse<GmailSentResult>> {
    // Mode check: sending requires APPROVAL_REQUIRED or WRITE_ENABLED
    if (!isWriteAllowed(this.mode)) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: `Sending email blocked: Current mode is ${this.mode}. Requires REAL_APPROVAL_REQUIRED or REAL_WRITE_ENABLED.`,
          provider: "GMAIL",
          retryable: false,
          statusCode: 403,
        },
        meta: this.meta(),
      };
    }

    // Approval token check
    if (!input.approvalToken || !input.approvalToken.isApproved) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Sending email blocked: Action-specific approval is required.",
          provider: "GMAIL",
          retryable: false,
          statusCode: 403,
        },
        meta: this.meta(),
      };
    }

    // Content hash check
    const currentHash = computeHash(input.body);
    if (input.approvalToken.contentHash !== currentHash) {
      return {
        success: false,
        error: {
          code: "APPROVAL_MISMATCH",
          message: "Content hash mismatch: Email text was altered after approval.",
          provider: "GMAIL",
          retryable: false,
          statusCode: 409,
        },
        meta: this.meta(),
      };
    }

    try {
      const auth = this.getAuth();
      const gmail = google.gmail({ version: "v1", auth });

      const raw = this.base64url(this.buildMimeMessage(input.to, input.subject, input.body));

      const res = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw },
      });

      const sentId = res.data.id || `sent-${Date.now()}`;
      const threadId = res.data.threadId || `thread-${Date.now()}`;

      logger.info("REAL_GMAIL", `Email sent: ${sentId}`, { to: input.to, subject: input.subject });

      return {
        success: true,
        data: {
          id: sentId,
          threadId,
          sentAt: new Date().toISOString(),
          recipient: input.to,
        },
        meta: this.meta(),
      };
    } catch (err) {
      return { success: false, error: this.handleError(err, "sendApprovedEmail"), meta: this.meta() };
    }
  }
}
