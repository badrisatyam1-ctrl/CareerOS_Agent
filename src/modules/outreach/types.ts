/**
 * Gmail Recruiter Outreach Domain Types
 */

export interface RecruiterContactInfo {
  id: string;
  fullName: string;
  title: string;
  companyName: string;
  email: string;
  provenanceUrl: string; // Verified public source proving email/identity
  isDoNotContact: boolean;
  roleLink: string;
  dateDiscovered: string;
  lastContactDate?: string;
  followUpCount: number;
}

export interface ResumeAttachmentInfo {
  fileName: string;
  storagePath: string;
  fileSizeBytes: number;
  checksumSha256: string;
  versionLabel: string;
}

export interface OutreachMessageDraft {
  id: string;
  recipient: RecruiterContactInfo;
  jobId: string;
  jobTitle: string;
  companyName: string;
  subject: string;
  bodyText: string;
  dedupeKey: string; // recipient + job + campaign hash
  attachment?: ResumeAttachmentInfo;
  status:
    | "DRAFT"
    | "NEEDS_REVIEW"
    | "APPROVED"
    | "SENT"
    | "REPLIED"
    | "BOUNCED"
    | "BLOCKED"
    | "FOLLOW_UP_DRAFTED";
  approvalId?: string;
  contentHash?: string;
  sentAt?: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
  createdAt: string;
}

export interface FollowUpRuleCheck {
  isEligible: boolean;
  reasons: string[];
  daysSinceLastContact: number;
  minIntervalDays: number; // default: 7 days
  maxFollowUpsAllowed: number; // default: 1
}

export interface OutreachCampaignLimits {
  dailySendLimit: number; // default 5
  dailySentCount: number;
  weeklySendLimit: number; // default 20
  weeklySentCount: number;
  isDailyLimitReached: boolean;
  isWeeklyLimitReached: boolean;
}
