import { ProviderResponse, ProviderError } from "../types";
import { computeHash } from "@/lib/crypto";

export interface GmailDraft {
  id: string;
  messageId: string;
  to: string;
  subject: string;
  body: string;
  hasResumeAttachment: boolean;
  createdAt: string;
}

export interface GmailSentResult {
  id: string;
  threadId: string;
  sentAt: string;
  recipient: string;
}

export interface CreateDraftInput {
  to: string;
  subject: string;
  body: string;
  attachResume?: boolean;
}

export interface SendEmailInput {
  draftId: string;
  to: string;
  subject: string;
  body: string;
  attachResume?: boolean;
  approvalToken: {
    approvalId: string;
    contentHash: string;
    isApproved: boolean;
  };
}

export interface IGmailAdapter {
  createEmailDraft(input: CreateDraftInput): Promise<ProviderResponse<GmailDraft>>;
  sendApprovedEmail(input: SendEmailInput): Promise<ProviderResponse<GmailSentResult>>;
}

export class MockGmailAdapter implements IGmailAdapter {
  public simulateExpired = false;
  public simulateRevoked = false;
  public simulateOutage = false;
  public simulateRateLimit = false;
  public sendCapabilityGranted = false; // Start draft-only by default

  private checkFailureModes(endpoint: string): ProviderError | null {
    if (this.simulateExpired) {
      return {
        code: "EXPIRED_CREDENTIALS",
        message: "Google OAuth token expired. Automatic refresh failed.",
        provider: "GMAIL",
        retryable: false,
        statusCode: 401,
      };
    }
    if (this.simulateRevoked) {
      return {
        code: "REVOKED_ACCESS",
        message: "Gmail OAuth access revoked from Google Security settings.",
        provider: "GMAIL",
        retryable: false,
        statusCode: 403,
      };
    }
    if (this.simulateOutage) {
      return {
        code: "PROVIDER_OUTAGE",
        message: "Gmail API returned HTTP 500 Internal Error.",
        provider: "GMAIL",
        retryable: true,
        statusCode: 500,
      };
    }
    if (this.simulateRateLimit) {
      return {
        code: "RATE_LIMITED",
        message: "Gmail daily sending / drafting quota reached.",
        provider: "GMAIL",
        retryable: true,
        statusCode: 429,
      };
    }
    return null;
  }

  async createEmailDraft(input: CreateDraftInput): Promise<ProviderResponse<GmailDraft>> {
    const error = this.checkFailureModes("createEmailDraft");
    const timestamp = new Date().toISOString();

    if (error) {
      return { success: false, error, meta: { provider: "GMAIL", timestamp } };
    }

    const draft: GmailDraft = {
      id: `draft-${Date.now()}`,
      messageId: `msg-${Date.now()}`,
      to: input.to,
      subject: input.subject,
      body: input.body,
      hasResumeAttachment: !!input.attachResume,
      createdAt: timestamp,
    };

    return {
      success: true,
      data: draft,
      meta: { provider: "GMAIL", timestamp },
    };
  }

  async sendApprovedEmail(input: SendEmailInput): Promise<ProviderResponse<GmailSentResult>> {
    const error = this.checkFailureModes("sendApprovedEmail");
    const timestamp = new Date().toISOString();

    if (error) {
      return { success: false, error, meta: { provider: "GMAIL", timestamp } };
    }

    // Security Gate §6 Enforcement:
    // 1. Must have explicit send capability enabled by user
    if (!this.sendCapabilityGranted) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Sending email blocked: Gmail send capability is not enabled. Draft-only mode active.",
          provider: "GMAIL",
          retryable: false,
          statusCode: 403,
        },
        meta: { provider: "GMAIL", timestamp },
      };
    }

    // 2. Must have valid user approval
    if (!input.approvalToken || !input.approvalToken.isApproved) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Sending email blocked: Action-specific approval is required before dispatch.",
          provider: "GMAIL",
          retryable: false,
          statusCode: 403,
        },
        meta: { provider: "GMAIL", timestamp },
      };
    }

    // 3. Body content hash must match approved hash
    const currentHash = computeHash(input.body);
    if (input.approvalToken.contentHash !== currentHash) {
      return {
        success: false,
        error: {
          code: "APPROVAL_MISMATCH",
          message: "Content hash mismatch: Email text was altered after user approval was issued.",
          provider: "GMAIL",
          retryable: false,
          statusCode: 409,
        },
        meta: { provider: "GMAIL", timestamp },
      };
    }

    return {
      success: true,
      data: {
        id: `sent-${Date.now()}`,
        threadId: `thread-${Date.now()}`,
        sentAt: timestamp,
        recipient: input.to,
      },
      meta: { provider: "GMAIL", timestamp },
    };
  }
}
