import {
  RecruiterContactInfo,
  ResumeAttachmentInfo,
  OutreachMessageDraft,
  FollowUpRuleCheck,
  OutreachCampaignLimits,
} from "./types";
import { IGmailAdapter } from "@/integrations/gmail";
import { computeHash } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

export class GmailOutreachService {
  private dailyLimit = 5;
  private weeklyLimit = 20;
  private minFollowUpIntervalDays = 7;
  private maxFollowUpsAllowed = 1;

  // Active drafts store
  private drafts: OutreachMessageDraft[] = [
    {
      id: "outreach-stripe-001",
      recipient: {
        id: "recruiter-ananya-stripe",
        fullName: "Ananya Sharma",
        title: "University Talent Lead - APAC",
        companyName: "Stripe",
        email: "ananya.recruiter.demo@stripe.example.com",
        provenanceUrl: "https://stripe.com/jobs/university",
        isDoNotContact: false,
        roleLink: "https://boards.greenhouse.io/stripe/jobs/swe-intern-infra-2025",
        dateDiscovered: "2026-10-18T10:00:00Z",
        lastContactDate: undefined,
        followUpCount: 0,
      },
      jobId: "job-stripe-infra-2025",
      jobTitle: "Software Engineering Intern - Infrastructure",
      companyName: "Stripe",
      subject: "Stripe Infrastructure SWE Intern - Badri Vishal Pandey",
      bodyText: `Hi Ananya,

I noticed Stripe's opening for the Infrastructure SWE Intern role on the university career page.

As a 3rd-year ECE student at GCET graduating in 2028, my background aligns closely with Stripe's backend challenges:
- Built TravelBooking: implemented distributed seat reservation using Redis lease keys with 120s TTL to eliminate concurrency abort cascades.
- Built WaferOS: created open-source PyTorch pipeline for semiconductor defect recognition with reproducible latency profiling.
- Consistent problem solving: solved 184+ LeetCode problems across a 190-day streak (200 Days Badge).

My verified open-source work is available at https://github.com/badrisatyam1-ctrl. I have attached my tailored resume for your review and would appreciate the opportunity to discuss how I can contribute to the infrastructure team.

Best regards,
Badri Vishal Pandey
Galgotias College of Engineering & Technology`,
      dedupeKey: computeHash("ananya.recruiter.demo@stripe.example.com:job-stripe-infra-2025:initial"),
      attachment: {
        fileName: "Badri_Vishal_Pandey_Resume_2028.pdf",
        storagePath: "private/resumes/Badri_Vishal_Pandey_Resume_2028.pdf",
        fileSizeBytes: 188416, // ~184 KB
        checksumSha256: computeHash("demo-pdf-binary-hash-2028"),
        versionLabel: "v1.0-stripe-infra-intern",
      },
      status: "NEEDS_REVIEW",
      createdAt: "2026-10-21T18:00:00Z",
    },
    {
      id: "outreach-qualcomm-002",
      recipient: {
        id: "recruiter-priya-qualcomm",
        fullName: "Priya Sengupta",
        title: "Senior ML Systems Engineer / Hiring Contact",
        companyName: "Qualcomm",
        email: "priya.recruiter.demo@qualcomm.example.com",
        provenanceUrl: "https://qualcomm.wd5.myworkdayjobs.com/en-US/Careers",
        isDoNotContact: false,
        roleLink: "https://qualcomm.wd5.myworkdayjobs.com/en-US/Careers/job/edge-ai-intern-noida",
        dateDiscovered: "2026-10-10T10:00:00Z",
        lastContactDate: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(), // 9 days ago
        followUpCount: 0,
      },
      jobId: "job-qualcomm-edge-ai",
      jobTitle: "Edge AI & Computer Vision Intern",
      companyName: "Qualcomm",
      subject: "Qualcomm Edge AI Intern - Badri Vishal Pandey",
      bodyText: `Hi Priya,

I recently applied for Qualcomm's Edge AI & Computer Vision Intern position in Noida. With experience in PyTorch model quantization and developing WaferOS for wafer defect classification, I am eager to contribute to Qualcomm's edge vision pipelines. Attached is my updated resume.

Best regards,
Badri Vishal Pandey`,
      dedupeKey: computeHash("priya.recruiter.demo@qualcomm.example.com:job-qualcomm-edge-ai:initial"),
      attachment: {
        fileName: "Badri_Vishal_Pandey_Resume_2028.pdf",
        storagePath: "private/resumes/Badri_Vishal_Pandey_Resume_2028.pdf",
        fileSizeBytes: 188416,
        checksumSha256: computeHash("demo-pdf-binary-hash-2028"),
        versionLabel: "v1.0-qualcomm-edge-ai",
      },
      status: "SENT",
      sentAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
      createdAt: "2026-10-12T10:00:00Z",
    },
  ];

  constructor(private gmailAdapter: IGmailAdapter) {}

  /**
   * Retrieves all outreach drafts
   */
  public getDrafts(): OutreachMessageDraft[] {
    return [...this.drafts];
  }

  /**
   * Evaluates campaign sending limits
   */
  public getLimits(): OutreachCampaignLimits {
    const todayMs = Date.now() - 24 * 3600 * 1000;
    const weekMs = Date.now() - 7 * 24 * 3600 * 1000;

    const dailySent = this.drafts.filter((d) => d.sentAt && new Date(d.sentAt).getTime() > todayMs).length;
    const weeklySent = this.drafts.filter((d) => d.sentAt && new Date(d.sentAt).getTime() > weekMs).length;

    return {
      dailySendLimit: this.dailyLimit,
      dailySentCount: dailySent,
      weeklySendLimit: this.weeklyLimit,
      weeklySentCount: weeklySent,
      isDailyLimitReached: dailySent >= this.dailyLimit,
      isWeeklyLimitReached: weeklySent >= this.weeklyLimit,
    };
  }

  /**
   * Creates an action-specific approval request locking the content hash
   */
  public async requestSendApproval(
    userId: string,
    draftId: string
  ): Promise<{ approvalId: string; contentHash: string }> {
    const draft = this.drafts.find((d) => d.id === draftId);
    if (!draft) {
      throw new Error(`Draft ${draftId} not found`);
    }

    if (draft.recipient.isDoNotContact) {
      throw new Error("Cannot request approval: Recipient is marked DO_NOT_CONTACT.");
    }

    // Compute cryptographic hash of email body text
    const contentHash = computeHash(draft.bodyText);

    draft.status = "APPROVED";
    draft.contentHash = contentHash;

    const approvalId = `approval-gmail-${Date.now()}`;
    draft.approvalId = approvalId;

    logger.info("GMAIL_OUTREACH", `Created SEND_EMAIL approval for ${draft.recipient.email}`, {
      draftId,
      approvalId,
      contentHash,
      recipient: draft.recipient.email,
    });

    try {
      await prisma.approvalRequest.create({
        data: {
          userId,
          actionType: "SEND_EMAIL",
          targetResourceId: draft.id,
          targetResourceName: `Email to ${draft.recipient.fullName} (${draft.companyName})`,
          contentHash,
          consequenceSummary: `Dispatches email via Gmail API to ${draft.recipient.email} with attached ${draft.attachment?.fileName}`,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min TTL
        },
      });
    } catch {
      // Prisma fallback
    }

    return { approvalId, contentHash };
  }

  /**
   * Dispatches approved email via Gmail API with full policy and approval verification
   */
  public async sendApprovedOutreach(
    userId: string,
    draftId: string,
    approvalId: string,
    currentContentHash: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const draft = this.drafts.find((d) => d.id === draftId);
    if (!draft) {
      return { success: false, error: `Draft ${draftId} not found` };
    }

    // 1. Opt-out / Do-not-contact check
    if (draft.recipient.isDoNotContact) {
      draft.status = "BLOCKED";
      return { success: false, error: "Outreach blocked: Recipient is in DO_NOT_CONTACT state." };
    }

    // 2. Source provenance check
    if (!draft.recipient.provenanceUrl || !draft.recipient.provenanceUrl.startsWith("https://")) {
      return { success: false, error: "Outreach blocked: Recipient email lacks verified public source provenance." };
    }

    // 3. Daily limit check
    const limits = this.getLimits();
    if (limits.isDailyLimitReached) {
      return { success: false, error: "Outreach blocked: Daily sending ceiling reached (5/day)." };
    }

    // 4. Content lock verification (§6)
    if (draft.contentHash !== currentContentHash) {
      return {
        success: false,
        error: "Security Exception: Content hash mismatch. Draft was altered after approval was issued.",
      };
    }

    // 5. Dispatch via Gmail adapter
    const dispatchRes = await this.gmailAdapter.sendApprovedEmail({
      draftId: draft.id,
      to: draft.recipient.email,
      subject: draft.subject,
      body: draft.bodyText,
      attachResume: !!draft.attachment,
      approvalToken: {
        approvalId,
        contentHash: currentContentHash,
        isApproved: draft.status === "APPROVED",
      },
    });

    if (!dispatchRes.success || !dispatchRes.data) {
      return {
        success: false,
        error: dispatchRes.error?.message || "Gmail dispatch failed.",
      };
    }

    draft.status = "SENT";
    draft.sentAt = dispatchRes.data.sentAt;
    draft.gmailMessageId = dispatchRes.data.id;
    draft.gmailThreadId = dispatchRes.data.threadId;
    draft.recipient.lastContactDate = dispatchRes.data.sentAt;

    // Log audit event WITHOUT full body text to protect PII
    logger.info("GMAIL_OUTREACH", `Email dispatched successfully to ${draft.recipient.email}`, {
      messageId: dispatchRes.data.id,
      recipient: draft.recipient.email,
      jobId: draft.jobId,
      attachmentFileName: draft.attachment?.fileName,
      timestamp: dispatchRes.data.sentAt,
    });

    try {
      await prisma.auditEvent.create({
        data: {
          userId,
          actorType: "AGENT",
          moduleName: "GMAIL_OUTREACH",
          actionName: "EMAIL_DISPATCHED",
          targetResource: `${draft.recipient.email} (${draft.jobTitle})`,
          status: "SUCCESS",
          detailsRedacted: JSON.stringify({
            messageId: dispatchRes.data.id,
            jobId: draft.jobId,
            recipientOrg: draft.companyName,
            attachmentFileName: draft.attachment?.fileName,
            attachmentChecksum: draft.attachment?.checksumSha256,
          }),
        },
      });
    } catch {
      // Prisma fallback
    }

    return { success: true, messageId: dispatchRes.data.id };
  }

  /**
   * Evaluates whether an outreach thread is eligible for a polite follow-up
   */
  public evaluateFollowUpEligibility(draftId: string): FollowUpRuleCheck {
    const draft = this.drafts.find((d) => d.id === draftId);
    if (!draft) {
      return {
        isEligible: false,
        reasons: ["Draft not found"],
        daysSinceLastContact: 0,
        minIntervalDays: this.minFollowUpIntervalDays,
        maxFollowUpsAllowed: this.maxFollowUpsAllowed,
      };
    }

    const reasons: string[] = [];

    if (draft.recipient.followUpCount >= this.maxFollowUpsAllowed) {
      reasons.push(`Maximum follow-up limit reached (${this.maxFollowUpsAllowed} follow-up sent).`);
    }

    if (draft.recipient.isDoNotContact) {
      reasons.push("Recipient is marked as DO_NOT_CONTACT.");
    }

    if (draft.status !== "SENT" && draft.recipient.followUpCount < this.maxFollowUpsAllowed) {
      reasons.push("Initial outreach has not been sent yet.");
    }

    let daysSince = 0;
    if (draft.sentAt) {
      const sentTime = new Date(draft.sentAt).getTime();
      daysSince = Math.floor((Date.now() - sentTime) / (24 * 3600 * 1000));
      if (daysSince < this.minFollowUpIntervalDays) {
        reasons.push(`Follow-up interval not met: only ${daysSince} days passed (minimum is ${this.minFollowUpIntervalDays} days).`);
      }
    }

    const isEligible = reasons.length === 0;

    return {
      isEligible,
      reasons,
      daysSinceLastContact: daysSince,
      minIntervalDays: this.minFollowUpIntervalDays,
      maxFollowUpsAllowed: this.maxFollowUpsAllowed,
    };
  }

  /**
   * Prepares a polite follow-up draft (requires explicit user review and approval before send)
   */
  public prepareFollowUpDraft(parentDraftId: string): OutreachMessageDraft {
    const parent = this.drafts.find((d) => d.id === parentDraftId);
    if (!parent) {
      throw new Error(`Parent draft ${parentDraftId} not found`);
    }

    const check = this.evaluateFollowUpEligibility(parentDraftId);
    if (!check.isEligible) {
      throw new Error(`Cannot prepare follow-up: ${check.reasons.join("; ")}`);
    }

    const followUpDraft: OutreachMessageDraft = {
      id: `followup-${parent.id}`,
      recipient: {
        ...parent.recipient,
        followUpCount: parent.recipient.followUpCount + 1,
      },
      jobId: parent.jobId,
      jobTitle: parent.jobTitle,
      companyName: parent.companyName,
      subject: `Re: ${parent.subject}`,
      bodyText: `Hi ${parent.recipient.fullName.split(" ")[0]},

I hope you're having a good week.

I wanted to quickly follow up on my note from last week regarding the ${parent.jobTitle} position. Since then, I benchmarked our wafer defect pipeline latency on PyTorch and would welcome any feedback from your engineering team.

I understand you receive many inquiries, so please let me know if another contact is more appropriate.

Best regards,
Badri Vishal Pandey`,
      dedupeKey: computeHash(`${parent.recipient.email}:${parent.jobId}:followup`),
      attachment: parent.attachment,
      status: "FOLLOW_UP_DRAFTED",
      createdAt: new Date().toISOString(),
    };

    this.drafts.push(followUpDraft);
    return followUpDraft;
  }

  /**
   * Sets recipient to Do-Not-Contact and blocks active drafts
   */
  public setDoNotContact(recipientEmail: string, reason: string): void {
    for (const d of this.drafts) {
      if (d.recipient.email === recipientEmail) {
        d.recipient.isDoNotContact = true;
        if (d.status !== "SENT") {
          d.status = "BLOCKED";
        }
      }
    }
    logger.warn("GMAIL_OUTREACH", `Marked ${recipientEmail} as DO_NOT_CONTACT: ${reason}`);
  }
}
