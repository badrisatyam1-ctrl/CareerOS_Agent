import { describe, it, expect } from "vitest";
import {
  UserProfileSchema,
  JobOpeningSchema,
  OutreachDraftSchema,
  LinkedInContentDraftSchema,
  ApprovalDecisionSchema,
} from "@/lib/validations";

describe("Validation Schemas (Zod Boundary Guard)", () => {
  it("should validate a valid UserProfile", () => {
    const validProfile = {
      fullName: "Badri Vishal Pandey",
      email: "badri@example.com",
      headline: "ECE Undergrad @ GCET",
      portfolioUrl: "https://portfolio-bjzy.vercel.app/",
      githubUrl: "https://github.com/badrisatyam1-ctrl",
      linkedinUrl: "https://www.linkedin.com/in/badri-vishal-pandey-0a7913324",
      leetcodeUrl: "https://leetcode.com/u/Badri1888/",
    };

    const result = UserProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("should reject an invalid email in UserProfile", () => {
    const invalidProfile = {
      fullName: "Badri Vishal Pandey",
      email: "not-an-email",
    };

    const result = UserProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });

  it("should validate a valid JobOpening", () => {
    const validJob = {
      canonicalUrl: "https://boards.greenhouse.io/demo/jobs/backend-intern-2025",
      companyName: "Stripe",
      roleTitle: "Software Engineering Intern - Infrastructure",
      location: "Remote",
      workMode: "REMOTE",
      roleType: "INTERN",
      dedupeHash: "1234567890abcdef",
      status: "ACTIVE",
    };

    const result = JobOpeningSchema.safeParse(validJob);
    expect(result.success).toBe(true);
  });

  it("should enforce evidence fact requirement on LinkedInContentDraft", () => {
    const draftWithoutEvidence = {
      topic: "WaferOS Deep Learning",
      targetAudience: "Engineers",
      postContent: "Check out this deep learning wafer defect classification tool.",
      hashtags: ["#DeepLearning"],
      evidenceFactIds: [], // Empty! Violates rule: Evidence before claims
    };

    const result = LinkedInContentDraftSchema.safeParse(draftWithoutEvidence);
    expect(result.success).toBe(false);
  });

  it("should validate approval decision with 64-char SHA-256 content hash", () => {
    const decision = {
      approvalRequestId: "123e4567-e89b-12d3-a456-426614174000",
      decision: "APPROVE",
      contentHash: "a".repeat(64),
    };

    const result = ApprovalDecisionSchema.safeParse(decision);
    expect(result.success).toBe(true);
  });
});
