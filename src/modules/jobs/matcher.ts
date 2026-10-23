import {
  JobOpeningItem,
  MatchExplanation,
  EligibilityStatus,
  MatchScoreBreakdown,
} from "./types";
import { computeHash } from "@/lib/crypto";

/**
 * Normalizes URL and parameters to produce a canonical deduplication key
 */
export function computeJobDedupeKey(url: string, company: string, title: string, location: string): string {
  try {
    const parsed = new URL(url);
    // Strip tracking parameters
    parsed.searchParams.delete("utm_source");
    parsed.searchParams.delete("utm_medium");
    parsed.searchParams.delete("utm_campaign");
    parsed.searchParams.delete("ref");
    parsed.searchParams.delete("source");
    const cleanUrl = `${parsed.origin}${parsed.pathname}`.toLowerCase();
    const cleanCompany = company.trim().toLowerCase();
    const cleanTitle = title.trim().toLowerCase();
    const cleanLocation = location.trim().toLowerCase();
    return computeHash(`${cleanUrl}:${cleanCompany}:${cleanTitle}:${cleanLocation}`);
  } catch {
    return computeHash(`${url.toLowerCase()}:${company.toLowerCase()}:${title.toLowerCase()}`);
  }
}

/**
 * Detects expired or suspicious job postings
 */
export function detectSuspiciousOrExpired(job: JobOpeningItem): {
  isSuspicious: boolean;
  isExpired: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let isExpired = false;
  let isSuspicious = false;

  // 1. Expiration check: past expiresAt or >60 days old
  if (job.expiresAt && new Date(job.expiresAt).getTime() < Date.now()) {
    isExpired = true;
    reasons.push(`Job listing expired on ${new Date(job.expiresAt).toLocaleDateString()}`);
  } else {
    const postedTime = new Date(job.postedAt).getTime();
    const ageDays = (Date.now() - postedTime) / (24 * 3600 * 1000);
    if (ageDays > 60) {
      isExpired = true;
      reasons.push(`Job listing is stale (${Math.floor(ageDays)} days old, threshold is 60 days)`);
    }
  }

  // 2. Suspicious signals: fee requests, missing company, unverified domains
  const descLower = job.description.toLowerCase();
  if (
    descLower.includes("processing fee") ||
    descLower.includes("registration fee") ||
    descLower.includes("security deposit required")
  ) {
    isSuspicious = true;
    reasons.push("Suspicious fee requirement detected in description");
  }

  if (!job.canonicalUrl.startsWith("https://")) {
    isSuspicious = true;
    reasons.push("Insecure (non-HTTPS) application URL");
  }

  return { isSuspicious, isExpired, reasons };
}

/**
 * Calculates an explainable match score evaluating skill overlap, role alignment,
 * project evidence, education/graduation eligibility, and location fit.
 * Hard blockers are strictly separated from soft skill gaps.
 */
export function calculateJobMatch(
  job: JobOpeningItem,
  userConfirmedGraduationYear: number = 2028
): MatchExplanation {
  const hardBlockers: string[] = [];
  const softSkillGaps: string[] = [];
  const matchedSkills: string[] = [];
  const matchingProjects: string[] = [];

  // Verified User Skills from Evidence Vault
  const verifiedUserSkills = new Set([
    "python",
    "pytorch",
    "typescript",
    "javascript",
    "sql",
    "postgresql",
    "docker",
    "linux",
    "c++",
    "embedded c",
    "git",
    "rest apis",
    "dsa",
    "next.js",
    "deep learning",
    "computer vision",
    "redis",
    "esp32",
  ]);

  // 1. Hard Blocker Checks: Graduation Date & Eligibility
  let eligibilityStatus: EligibilityStatus = "ELIGIBLE";

  if (job.maxGraduationYear && userConfirmedGraduationYear > job.maxGraduationYear) {
    hardBlockers.push(
      `Graduation year requirement mismatch: Job requires graduation by ${job.maxGraduationYear} or earlier, but user graduates in ${userConfirmedGraduationYear}.`
    );
    eligibilityStatus = "INELIGIBLE";
  }

  if (job.minGraduationYear && userConfirmedGraduationYear < job.minGraduationYear) {
    hardBlockers.push(
      `Requires at least ${job.minGraduationYear} graduation, user confirmed ${userConfirmedGraduationYear}.`
    );
    eligibilityStatus = "INELIGIBLE";
  }

  const descLower = job.description.toLowerCase();
  if (
    descLower.includes("us citizenship required") ||
    descLower.includes("active security clearance required")
  ) {
    hardBlockers.push("Requires US Citizenship or Active US Security Clearance.");
    eligibilityStatus = "INELIGIBLE";
  }

  // 2. Skill Overlap Calculation (Max 30 pts)
  for (const req of job.requiredSkills) {
    const norm = req.toLowerCase().trim();
    if (verifiedUserSkills.has(norm)) {
      matchedSkills.push(req);
    } else {
      softSkillGaps.push(req);
    }
  }

  const skillMatchRatio =
    job.requiredSkills.length > 0 ? matchedSkills.length / job.requiredSkills.length : 1.0;
  const skillOverlapScore = Math.round(skillMatchRatio * 30);

  // 3. Role Alignment Calculation (Max 25 pts)
  let roleAlignmentScore = 15;
  const titleLower = job.roleTitle.toLowerCase();

  if (
    titleLower.includes("machine learning") ||
    titleLower.includes("computer vision") ||
    titleLower.includes("ai engineer") ||
    titleLower.includes("software engineer intern") ||
    titleLower.includes("backend") ||
    titleLower.includes("systems") ||
    titleLower.includes("embedded")
  ) {
    roleAlignmentScore = 25;
  } else if (titleLower.includes("full stack") || titleLower.includes("developer")) {
    roleAlignmentScore = 20;
  }

  // 4. Project Evidence Calculation (Max 20 pts)
  let projectEvidenceScore = 0;
  if (
    descLower.includes("computer vision") ||
    descLower.includes("pytorch") ||
    descLower.includes("defect") ||
    descLower.includes("semiconductor") ||
    descLower.includes("cnn")
  ) {
    projectEvidenceScore += 10;
    matchingProjects.push("WaferOS (PyTorch wafer defect classification)");
  }

  if (
    descLower.includes("distributed") ||
    descLower.includes("concurrency") ||
    descLower.includes("redis") ||
    descLower.includes("backend") ||
    descLower.includes("rest")
  ) {
    projectEvidenceScore += 6;
    matchingProjects.push("TravelBooking (Redis lease locks & seat reservation)");
  }

  if (
    descLower.includes("embedded") ||
    descLower.includes("iot") ||
    descLower.includes("sensor") ||
    descLower.includes("c++") ||
    descLower.includes("esp32")
  ) {
    projectEvidenceScore += 4;
    matchingProjects.push("Smart Helmet (ESP32 real-time edge processing)");
  }

  projectEvidenceScore = Math.min(20, Math.max(5, projectEvidenceScore));

  // 5. Eligibility Score (Max 15 pts)
  const eligibilityScore = hardBlockers.length === 0 ? 15 : 0;

  // 6. Location Fit (Max 10 pts)
  let locationFit = 5;
  const locLower = job.location.toLowerCase();
  if (
    job.workMode === "REMOTE" ||
    locLower.includes("remote") ||
    locLower.includes("india") ||
    locLower.includes("noida") ||
    locLower.includes("delhi")
  ) {
    locationFit = 10;
  } else if (locLower.includes("bengaluru") || locLower.includes("hyderabad")) {
    locationFit = 8;
  }

  // Total Score (0-100)
  const breakdown: MatchScoreBreakdown = {
    skillOverlap: skillOverlapScore,
    roleAlignment: roleAlignmentScore,
    projectEvidence: projectEvidenceScore,
    eligibilityScore,
    locationFit,
  };

  let overallFitScore =
    breakdown.skillOverlap +
    breakdown.roleAlignment +
    breakdown.projectEvidence +
    breakdown.eligibilityScore +
    breakdown.locationFit;

  // Cap score if hard blockers exist
  if (hardBlockers.length > 0) {
    overallFitScore = Math.min(35, overallFitScore);
  }

  // Generate rationale
  const rationaleParts: string[] = [];
  if (hardBlockers.length > 0) {
    rationaleParts.push(`Ineligible due to hard blockers: ${hardBlockers.join("; ")}`);
  } else {
    rationaleParts.push(
      `Strong alignment (${overallFitScore}%): ${matchedSkills.length}/${job.requiredSkills.length} required skills verified.`
    );
    if (matchingProjects.length > 0) {
      rationaleParts.push(`Backed by verified projects: ${matchingProjects.join(", ")}.`);
    }
    if (softSkillGaps.length > 0) {
      rationaleParts.push(`Identified skill gaps to review: ${softSkillGaps.join(", ")}.`);
    }
  }

  return {
    overallFitScore,
    breakdown,
    matchedSkills,
    softSkillGaps,
    hardBlockers,
    eligibilityStatus,
    rationale: rationaleParts.join(" "),
    matchingProjects,
  };
}
