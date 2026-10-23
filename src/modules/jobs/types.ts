/**
 * Job Discovery & Matching Domain Types
 */

export type WorkMode = "REMOTE" | "HYBRID" | "ON_SITE";
export type RoleType = "INTERN" | "FULL_TIME" | "CONTRACT";
export type JobStatus = "ACTIVE" | "STALE" | "EXPIRED" | "SUSPICIOUS";
export type EligibilityStatus = "ELIGIBLE" | "INELIGIBLE" | "UNVERIFIED_REQUIREMENTS";

export type ApplicationStage =
  | "DISCOVERED"
  | "SHORTLISTED"
  | "DRAFTING"
  | "APPROVED"
  | "APPLIED"
  | "ASSESSMENT"
  | "INTERVIEW"
  | "REJECTED"
  | "OFFER"
  | "CLOSED";

export type SourcePlatform =
  | "GREENHOUSE_PUBLIC"
  | "LEVER_PUBLIC"
  | "ASHBY_PUBLIC"
  | "COMPANY_SITE"
  | "SEARCH_PROVIDER";

export interface JobOpeningItem {
  id: string;
  canonicalUrl: string;
  companyName: string;
  roleTitle: string;
  location: string;
  workMode: WorkMode;
  roleType: RoleType;
  description: string;
  postedAt: string;
  expiresAt?: string;
  firstSeenAt: string;
  dedupeHash: string;
  status: JobStatus;
  salaryOrStipend?: string;
  isPaid: boolean;
  sourcePlatform: SourcePlatform;
  minGraduationYear?: number;
  maxGraduationYear?: number;
  requiredSkills: string[];
  preferredSkills: string[];
  recruiterEmail?: string;
  recruiterEmailProvenanceUrl?: string;
}

export interface MatchScoreBreakdown {
  skillOverlap: number;       // 0 - 30 pts
  roleAlignment: number;      // 0 - 25 pts
  projectEvidence: number;    // 0 - 20 pts
  eligibilityScore: number;   // 0 - 15 pts
  locationFit: number;        // 0 - 10 pts
}

export interface MatchExplanation {
  overallFitScore: number;    // 0 - 100
  breakdown: MatchScoreBreakdown;
  matchedSkills: string[];
  softSkillGaps: string[];
  hardBlockers: string[];
  eligibilityStatus: EligibilityStatus;
  rationale: string;
  matchingProjects: string[];
}

export interface JobFilters {
  roleType: "ALL" | RoleType;
  workMode: "ALL" | WorkMode;
  locationPreference: "ALL" | "GREATER_NOIDA" | "NOIDA" | "DELHI_NCR" | "INDIA" | "REMOTE";
  paidOnly: boolean;
  minStipendMonthly?: number;
  requiredSkill?: string;
  eligibilityOnly: boolean;
  freshnessDays?: number; // 7, 14, 30, or undefined
  stage: "ALL" | ApplicationStage;
}
