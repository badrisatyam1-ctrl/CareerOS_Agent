/**
 * Interview Preparation & Learning Domain Types
 */

export type SkillDemonstrationLevel =
  | "DEMONSTRATED_BY_PROJECT"
  | "PARTIALLY_DEMONSTRATED"
  | "MISSING_UNKNOWN";

export interface SkillMatrixEntry {
  name: string;
  requirementType: "REQUIRED" | "PREFERRED";
  level: SkillDemonstrationLevel;
  evidenceRef?: string;
  reason: string;
}

export interface JobSkillMatrix {
  jobId: string;
  companyName: string;
  roleTitle: string;
  entries: SkillMatrixEntry[];
  summary: {
    requiredCount: number;
    demonstratedCount: number;
    gapCount: number;
  };
}

export interface InterviewQuestion {
  id: string;
  category: "CODING_DSA" | "SYSTEM_DESIGN" | "ML_CV" | "EMBEDDED" | "BEHAVIORAL_STAR";
  prompt: string;
  contextProject?: string;
  keyPointsToHit: string[];
}

export interface StarStory {
  id: string;
  title: string;
  targetCompetency: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  verifiedEvidenceRef: string;
}

export interface StudyPlanMilestone {
  weekNumber: number;
  title: string;
  focusArea: string;
  tasks: string[];
  isCompleted: boolean;
}

export interface PracticeSessionRecord {
  id: string;
  skillName: string;
  sessionType: "CODING" | "SYSTEM_DESIGN" | "MOCK_INTERVIEW" | "PROJECT_DEEP_DIVE";
  notes: string;
  durationMinutes: number;
  confidenceRating: number; // 1 to 5
  completedAt: string;
}
