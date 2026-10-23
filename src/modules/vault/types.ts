/**
 * Career Evidence Vault & Memory Domain Types
 */

export type FactType =
  | "SKILL"
  | "PROJECT"
  | "EDUCATION"
  | "VERIFIED_GITHUB_PR"
  | "METRIC"
  | "CERTIFICATION"
  | "AWARD";

export type FactSourceType =
  | "GITHUB_REPO"
  | "GITHUB_PR"
  | "RESUME_LINE"
  | "CREDENTIAL_URL"
  | "USER_CONFIRMED";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "UNVERIFIED";

export interface EvidenceFactItem {
  id: string;
  factType: FactType;
  title: string;
  claimSummary: string;
  sourceType: FactSourceType;
  sourceUrl?: string;
  sourceLocator?: string; // commit hash, line number, or section
  confidenceLevel: ConfidenceLevel;
  lastVerifiedAt: string;
  userConfirmedAt?: string;
  tags: string[];
}

export interface TonePreferenceSettings {
  primaryTone: "HUMBLE_TECHNICAL" | "CONCISE_ENGINEERING" | "ANALYTICAL";
  avoidBuzzwords: boolean;
  maxEmojisPerPost: number;
}

export interface CareerPreferencesData {
  targetRoles: string[];
  preferredLocations: string[];
  targetCompanies: string[];
  salaryFloorMonthlyInr?: number;
  tone: TonePreferenceSettings;
  privateNotes: string; // Strictly private, NEVER published
  lastUpdated: string;
}

export interface ClaimVerificationResult {
  isSupported: boolean;
  matchingFacts: EvidenceFactItem[];
  missingEvidenceMessage?: string;
}
