import { z } from "zod";

// ==========================================
// User & Career Preferences Schemas
// ==========================================

export const UserProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  headline: z.string().optional(),
  location: z.string().optional(),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  leetcodeUrl: z.string().url().optional().or(z.literal("")),
});

export const CareerPreferencesSchema = z.object({
  targetRoles: z.array(z.string()).min(1, "At least one target role is required"),
  targetLocations: z.array(z.string()).min(1, "At least one target location is required"),
  workModes: z.array(z.enum(["REMOTE", "HYBRID", "ON_SITE"])).min(1),
  graduationYear: z.number().int().min(2024).max(2035).optional(),
  workAuthorization: z.string().optional(),
  minStipendMonthly: z.number().nonnegative().optional(),
  excludedCompanies: z.array(z.string()).default([]),
});

// ==========================================
// Evidence Fact Schema
// ==========================================

export const EvidenceFactSchema = z.object({
  factType: z.enum(["PROJECT_METRIC", "SKILL", "CERTIFICATION", "EDUCATION", "OPEN_SOURCE"]),
  title: z.string().min(3),
  claimValue: z.string().min(5),
  sourceType: z.enum(["GITHUB_REPO", "CERTIFICATE_URL", "LIVE_DEMO", "TRANSCRIPT", "RESUME_DOCUMENT"]),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  sourceLocator: z.string().optional(),
  verificationStatus: z.enum(["VERIFIED", "RESUME_REPORTED", "UNVERIFIED", "CONFLICTING"]).default("VERIFIED"),
  confidenceScore: z.number().min(0).max(1).default(1.0),
});

// ==========================================
// Job Discovery & Application Schemas
// ==========================================

export const JobOpeningSchema = z.object({
  canonicalUrl: z.string().url(),
  companyName: z.string().min(1),
  roleTitle: z.string().min(1),
  location: z.string().min(1),
  workMode: z.enum(["REMOTE", "HYBRID", "ON_SITE"]).default("REMOTE"),
  roleType: z.enum(["INTERN", "FULL_TIME", "CONTRACT"]).default("INTERN"),
  description: z.string().optional(),
  postedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  dedupeHash: z.string().min(8),
  status: z.enum(["ACTIVE", "STALE", "EXPIRED", "SUSPICIOUS"]).default("ACTIVE"),
});

export const JobApplicationStageSchema = z.enum([
  "DISCOVERED",
  "SHORTLISTED",
  "DRAFTING",
  "READY_FOR_REVIEW",
  "APPROVED",
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
]);

export const JobApplicationUpdateSchema = z.object({
  applicationId: z.string().uuid(),
  stage: JobApplicationStageSchema,
  notes: z.string().optional(),
  portalUrl: z.string().url().optional().or(z.literal("")),
});

// ==========================================
// Outreach & Contact Schemas
// ==========================================

export const RecruiterContactSchema = z.object({
  fullName: z.string().min(2),
  companyName: z.string().min(1),
  title: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  linkedinProfileUrl: z.string().url().optional().or(z.literal("")),
  provenanceUrl: z.string().url(),
  verificationState: z.enum(["VERIFIED_PUBLIC", "UNVERIFIED", "BOUNCED"]).default("UNVERIFIED"),
  isDoNotContact: z.boolean().default(false),
});

export const OutreachDraftSchema = z.object({
  recipientName: z.string().min(2),
  channel: z.enum(["GMAIL", "LINKEDIN_MANUAL"]),
  subject: z.string().max(100).optional(),
  bodyText: z.string().min(20).max(2000),
  dedupeKey: z.string().min(8),
});

// ==========================================
// LinkedIn Content Schemas
// ==========================================

export const LinkedInContentDraftSchema = z.object({
  topic: z.string().min(3).max(120),
  targetAudience: z.string().min(2),
  postContent: z.string().min(30).max(3000),
  hashtags: z.array(z.string().regex(/^#[a-zA-Z0-9_]+$/, "Invalid hashtag format")).max(5),
  evidenceFactIds: z.array(z.string()).min(1, "Post must link to at least one evidence fact"),
});

// ==========================================
// GitHub Lab & Contribution Schemas
// ==========================================

export const RepositoryWatchSchema = z.object({
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "Invalid repository format (owner/repo)"),
  repoUrl: z.string().url(),
  isOwned: z.boolean().default(false),
  isFork: z.boolean().default(false),
  defaultBranch: z.string().default("main"),
  primaryLanguage: z.string().optional(),
  topics: z.array(z.string()).default([]),
});

export const IssueCandidateSchema = z.object({
  issueNumber: z.number().int().positive(),
  issueUrl: z.string().url(),
  title: z.string().min(3),
  bodySummary: z.string().optional(),
  labels: z.array(z.string()).default([]),
  suitabilityScore: z.number().min(0).max(100),
  scoreRationale: z.string().min(5),
  complexityEstimate: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

export const ContributionPlanSchema = z.object({
  issueCandidateId: z.string().uuid(),
  branchName: z.string().regex(/^[\w/-]+$/, "Invalid git branch name"),
  contributionPlan: z.string().min(20),
});

// ==========================================
// Approval & Action Schemas
// ==========================================

export const ApprovalActionTypeSchema = z.enum([
  "SEND_EMAIL",
  "PUBLISH_LINKEDIN",
  "GIT_PUSH",
  "OPEN_PR",
  "APPLY_JOB",
]);

export const ApprovalDecisionSchema = z.object({
  approvalRequestId: z.string().uuid(),
  decision: z.enum(["APPROVE", "REJECT"]),
  contentHash: z.string().length(64, "Content hash must be 64-char SHA-256"),
});
