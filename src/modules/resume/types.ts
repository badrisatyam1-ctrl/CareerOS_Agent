/**
 * Truthful Resume Tailoring Domain Types
 */

export interface BaseResumeData {
  fullName: string;
  education: {
    degree: string;
    institution: string;
    graduationYear: number;
    status: string;
  };
  verifiedProjects: Array<{
    name: string;
    url: string;
    techStack: string[];
    keyAchievements: string[];
    evidenceRef: string;
  }>;
  verifiedSkills: string[];
  competitiveStats: {
    streakDays: number;
    problemsSolved: number;
    platform: string;
    profileUrl: string;
  };
}

export interface ChangedBullet {
  section: string;
  originalBullet: string;
  tailoredBullet: string;
  evidenceRef: string;
  rationale: string;
}

export interface TailoredResumeVariant {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  versionLabel: string;
  createdAt: string;
  isBaseImmutable: boolean;
  changedBullets: ChangedBullet[];
  matchedSkillsHighlighted: string[];
  skillGapsOmitted: string[]; // Skills in JD omitted because not in evidence vault
  unverifiedClaimsAttempted: string[]; // Flagged attempts to insert unverified metrics/skills
  graduationMismatchFlag?: string; // Flag for resume (2027) vs LinkedIn (2028)
  isApproved: boolean;
  approvalHash?: string;
  markdownContent: string;
}
