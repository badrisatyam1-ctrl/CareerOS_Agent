import { ProviderResponse, ProviderError } from "../types";
import { computeHash } from "@/lib/crypto";

export interface LinkedInPostDraft {
  id: string;
  topic: string;
  content: string;
  hashtags: string[];
  evidenceSources: string[];
  status: "DRAFT" | "APPROVED" | "MANUAL_HANDOFF_READY";
}

export interface LinkedInPublishResult {
  id: string;
  postUrl: string;
  publishedAt: string;
  mode: "OFFICIAL_API" | "MANUAL_HANDOFF";
}

export interface PublishPostInput {
  content: string;
  evidenceSources: string[];
  approvalToken: {
    approvalId: string;
    contentHash: string;
    isApproved: boolean;
  };
}

export interface ILinkedInAdapter {
  isOfficialPublishingSupported(): boolean;
  createDraft(topic: string, content: string, evidenceSources: string[], hashtags: string[]): Promise<ProviderResponse<LinkedInPostDraft>>;
  publishPost(input: PublishPostInput): Promise<ProviderResponse<LinkedInPublishResult>>;
}

export class MockLinkedInAdapter implements ILinkedInAdapter {
  public simulateExpired = false;
  public simulateRevoked = false;
  public simulateOutage = false;
  public simulateRateLimit = false;
  public hasOfficialMemberSocialScope = false; // By default FALSE (manual handoff only!)

  isOfficialPublishingSupported(): boolean {
    return this.hasOfficialMemberSocialScope;
  }

  private checkFailureModes(): ProviderError | null {
    if (this.simulateExpired) {
      return {
        code: "EXPIRED_CREDENTIALS",
        message: "LinkedIn OAuth session expired. Please re-authenticate.",
        provider: "LINKEDIN",
        retryable: false,
        statusCode: 401,
      };
    }
    if (this.simulateRevoked) {
      return {
        code: "REVOKED_ACCESS",
        message: "LinkedIn application permissions revoked by user.",
        provider: "LINKEDIN",
        retryable: false,
        statusCode: 403,
      };
    }
    if (this.simulateOutage) {
      return {
        code: "PROVIDER_OUTAGE",
        message: "LinkedIn API 502 Bad Gateway.",
        provider: "LINKEDIN",
        retryable: true,
        statusCode: 502,
      };
    }
    if (this.simulateRateLimit) {
      return {
        code: "RATE_LIMITED",
        message: "LinkedIn API rate limit reached.",
        provider: "LINKEDIN",
        retryable: true,
        statusCode: 429,
      };
    }
    return null;
  }

  async createDraft(
    topic: string,
    content: string,
    evidenceSources: string[],
    hashtags: string[]
  ): Promise<ProviderResponse<LinkedInPostDraft>> {
    const error = this.checkFailureModes();
    const timestamp = new Date().toISOString();

    if (error) {
      return { success: false, error, meta: { provider: "LINKEDIN", timestamp } };
    }

    // Verify evidence is supplied
    if (!evidenceSources || evidenceSources.length === 0) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "LinkedIn post draft rejected: Every technical claim must link to at least one verified evidence source.",
          provider: "LINKEDIN",
          retryable: false,
          statusCode: 422,
        },
        meta: { provider: "LINKEDIN", timestamp },
      };
    }

    return {
      success: true,
      data: {
        id: `li-draft-${Date.now()}`,
        topic,
        content,
        hashtags,
        evidenceSources,
        status: "DRAFT",
      },
      meta: { provider: "LINKEDIN", timestamp },
    };
  }

  async publishPost(input: PublishPostInput): Promise<ProviderResponse<LinkedInPublishResult>> {
    const error = this.checkFailureModes();
    const timestamp = new Date().toISOString();

    if (error) {
      return { success: false, error, meta: { provider: "LINKEDIN", timestamp } };
    }

    // Security check: Must be approved
    if (!input.approvalToken || !input.approvalToken.isApproved) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Publishing blocked: Explicit user approval required.",
          provider: "LINKEDIN",
          retryable: false,
          statusCode: 403,
        },
        meta: { provider: "LINKEDIN", timestamp },
      };
    }

    // Content hash check
    const currentHash = computeHash(input.content);
    if (input.approvalToken.contentHash !== currentHash) {
      return {
        success: false,
        error: {
          code: "APPROVAL_MISMATCH",
          message: "Content hash mismatch: Post text was altered after user approval.",
          provider: "LINKEDIN",
          retryable: false,
          statusCode: 409,
        },
        meta: { provider: "LINKEDIN", timestamp },
      };
    }

    // Official API vs Manual Handoff
    if (!this.hasOfficialMemberSocialScope) {
      // Manual fallback behavior (Policy Rule §10)
      return {
        success: true,
        data: {
          id: `manual-${Date.now()}`,
          postUrl: "https://www.linkedin.com/feed/?shareActive=true",
          publishedAt: timestamp,
          mode: "MANUAL_HANDOFF",
        },
        meta: {
          provider: "LINKEDIN",
          timestamp,
          sourceUrl: "https://www.linkedin.com/feed/?shareActive=true",
        },
      };
    }

    return {
      success: true,
      data: {
        id: `urn:li:share:${Date.now()}`,
        postUrl: `https://www.linkedin.com/feed/update/urn:li:activity:${Date.now()}`,
        publishedAt: timestamp,
        mode: "OFFICIAL_API",
      },
      meta: { provider: "LINKEDIN", timestamp },
    };
  }
}
