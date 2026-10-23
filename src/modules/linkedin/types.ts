/**
 * LinkedIn Content Studio Domain Types
 */

export type ContentTheme =
  | "BUILD_LOG"
  | "TECHNICAL_LESSON"
  | "OPEN_SOURCE_CONTRIBUTION"
  | "DEBUGGING_TRADEOFF"
  | "PROJECT_DEMO"
  | "DSA_LEARNING"
  | "HACKATHON_LESSON"
  | "ENGINEERING_COMMENTARY";

export interface EvidenceSource {
  label: string;
  url: string;
  factType: string;
  isVerified: boolean;
}

export interface ReviewChecklist {
  evidenceVerified: boolean;
  characterCountValid: boolean; // <= 3000 chars
  toneModest: boolean;          // No hyperbolic claims
  noSpamHooks: boolean;         // No "thrilled to announce", "Agree?", etc.
  noExcessEmojis: boolean;      // <= 4 emojis
  hashtagCountValid: boolean;   // 3 to 5 hashtags
  noSensitiveData: boolean;     // Clean from tokens, passwords, private PII
}

export interface QualityAnalysisResult {
  isValid: boolean;
  spamHooksFound: string[];
  emojiCount: number;
  hashtagCount: number;
  hyperbolicClaimsFound: string[];
  sensitivePatternsFound: string[];
  checklist: ReviewChecklist;
}

export interface LinkedInDraftCandidate {
  id: string;
  title: string;
  theme: ContentTheme;
  intendedAudience: string;
  corePoint: string;
  evidenceSources: EvidenceSource[];
  missingEvidencePrompt?: string;
  visualIdea: string;
  hashtags: string[];
  profileSuitabilityReason: string;
  content: string;
  characterCount: number;
  reviewChecklist: ReviewChecklist;
  status: "DRAFT" | "NEEDS_REVIEW" | "APPROVED" | "PUBLISHED_MANUAL" | "ARCHIVED";
  scheduledSlot: string;
  approvalHash?: string;
  createdAt: string;
}

export interface WeeklyContentPlan {
  weekStartDate: string;
  themeRotation: ContentTheme[];
  candidates: LinkedInDraftCandidate[];
  approvedCount: number;
  repetitionWarnings: string[];
}

export interface TonePreference {
  preferredLength: "CONCISE" | "BALANCED" | "DETAILED";
  voiceDescriptors: string[];
  sampleApprovedExcerpts: string[];
  approvedDraftsCount: number;
  lastUpdated: string;
}

export interface ArchivedPost {
  id: string;
  topic: string;
  theme: ContentTheme;
  publishedAt: string;
  summary: string;
}
