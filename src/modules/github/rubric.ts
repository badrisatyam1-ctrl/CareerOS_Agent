import { IssueRubricBreakdown } from "./types";

interface IssueEvaluationInput {
  title: string;
  body: string;
  labels: string[];
  isOpen: boolean;
  isAssigned: boolean;
  repoLanguage: string;
  hasContributing: boolean;
  hasLicense: boolean;
  hasCi: boolean;
  updatedAt: string;
  verifiedSkills: string[];
}

export function evaluateIssueRubric(input: IssueEvaluationInput): IssueRubricBreakdown {
  const warnings: string[] = [];
  const text = `${input.title} ${input.body}`.toLowerCase();
  const labels = input.labels.map((l) => l.toLowerCase());

  // 1. Skill Match Score (0 - 25)
  let skillMatchScore = 0;
  const targetLanguages = ["python", "typescript", "javascript", "go", "c++", "c", "sql"];
  const targetFrameworks = ["pytorch", "docker", "react", "next.js", "linux", "systems", "fastapi", "benchmark", "inference"];

  const matchedLang = targetLanguages.some((lang) =>
    input.repoLanguage.toLowerCase().includes(lang) || text.includes(lang)
  );
  if (matchedLang) skillMatchScore += 15;

  const hasSkillOverlap = input.verifiedSkills.some((s) =>
    text.includes(s.toLowerCase()) || input.repoLanguage.toLowerCase().includes(s.toLowerCase())
  );
  const matchedFramework = targetFrameworks.some((fw) => text.includes(fw));
  if (matchedFramework || hasSkillOverlap) skillMatchScore += 10;
  skillMatchScore = Math.min(25, skillMatchScore);

  // 2. Clarity Score (0 - 20)
  let clarityScore = 0;
  if (input.body.length > 50) clarityScore += 6;
  if (input.body.length > 150) clarityScore += 6;
  if (input.body.includes("```") || input.body.includes("reproduce") || input.body.includes("steps") || input.body.includes("Criteria")) {
    clarityScore += 5;
  }
  if (input.body.includes("expected") || input.body.includes("actual") || input.body.includes("acceptance") || input.body.includes("Criteria")) {
    clarityScore += 3;
  }
  clarityScore = Math.min(20, clarityScore);

  if (input.body.length < 50) {
    warnings.push("Issue description is very brief; high ambiguity.");
  }

  // 3. Testability Score (0 - 20)
  let testabilityScore = 0;
  if (input.hasCi) testabilityScore += 10;
  if (text.includes("test") || text.includes("pytest") || text.includes("jest") || text.includes("benchmark")) {
    testabilityScore += 7;
  }
  if (input.hasContributing) testabilityScore += 3;
  testabilityScore = Math.min(20, testabilityScore);

  // 4. Maintainer Signals Score (0 - 15)
  let maintainerScore = 0;
  // Labels are treated as hints
  const hasHelpfulLabel = labels.some((l) =>
    ["good first issue", "help wanted", "up-for-grabs", "contributions welcome"].includes(l)
  );
  if (hasHelpfulLabel) {
    maintainerScore += 8; // Maintainer explicitly flagged as welcoming
  } else {
    maintainerScore += 4;
  }

  if (input.hasContributing) maintainerScore += 4;
  if (!input.isAssigned) maintainerScore += 3;
  maintainerScore = Math.min(15, maintainerScore);

  if (input.isAssigned) {
    warnings.push("Issue is already assigned to a contributor; risk of duplicate effort.");
  }

  // 5. Repo Health Score (0 - 10)
  let repoHealthScore = 0;
  if (input.hasLicense) repoHealthScore += 5;
  if (input.hasContributing) repoHealthScore += 3;
  if (input.hasCi) repoHealthScore += 2;
  repoHealthScore = Math.min(10, repoHealthScore);

  if (!input.hasLicense) {
    warnings.push("Target repository has no clear open-source license.");
  }

  // 6. Freshness Score (0 - 10)
  let freshnessScore = 0;
  const daysSinceUpdate = (Date.now() - new Date(input.updatedAt).getTime()) / (1000 * 3600 * 24);
  if (daysSinceUpdate <= 7) freshnessScore = 10;
  else if (daysSinceUpdate <= 30) freshnessScore = 8;
  else if (daysSinceUpdate <= 60) freshnessScore = 5;
  else {
    freshnessScore = 2;
    warnings.push(`Issue has not been updated in ${Math.round(daysSinceUpdate)} days; verify if still relevant.`);
  }

  // Penalize closed or assigned issues
  if (!input.isOpen) {
    warnings.push("Issue is closed on GitHub.");
  }

  const totalScore = Math.round(
    skillMatchScore + clarityScore + testabilityScore + maintainerScore + repoHealthScore + freshnessScore
  );

  // Compute uncertainty
  let uncertainty: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  if (clarityScore < 10 || warnings.length >= 2) {
    uncertainty = "HIGH";
  } else if (clarityScore < 15 || warnings.length === 1) {
    uncertainty = "MEDIUM";
  }

  // Generate explainable rationale
  const rationaleParts: string[] = [];
  if (skillMatchScore >= 20) rationaleParts.push(`Strong overlap with confirmed ${input.repoLanguage} skills`);
  if (clarityScore >= 14) rationaleParts.push("actionable description with testable reproduction steps");
  if (hasHelpfulLabel) rationaleParts.push("maintainer welcomes external PRs");
  if (input.hasLicense) rationaleParts.push("permissive license verified");

  const rationale = rationaleParts.length > 0
    ? `Recommended because: ${rationaleParts.join(", ")}.`
    : "Evaluated with baseline requirements.";

  return {
    skillMatchScore,
    clarityScore,
    testabilityScore,
    maintainerScore,
    repoHealthScore,
    freshnessScore,
    totalScore,
    uncertainty,
    rationale,
    warnings,
  };
}
