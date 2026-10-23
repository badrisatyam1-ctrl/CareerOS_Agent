/**
 * Contribution Workbench Domain Types
 */

export interface PreCodingInspection {
  repoFullName: string;
  isWelcome: boolean;
  licenseSpdx: string | null;
  isLicenseClear: boolean;
  hasContributingGuide: boolean;
  hasCodeOfConduct: boolean;
  hasSecurityPolicy: boolean;
  hasActiveCi: boolean;
  duplicatePrDetected: boolean;
  existingPrUrl?: string;
  maintainerPreferencesSummary: string;
  unwelcomeReason?: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface ContributionPlan {
  issueNumber: number;
  issueTitle: string;
  issueSummary: string;
  acceptanceCriteria: string[];
  implementationHypothesis: string;
  riskAssessment: string;
  testPlan: string;
  targetBranch: string;
  featureBranchName: string;
  estimatedLinesChanged: number;
}

export interface SecretScanResult {
  hasSecrets: boolean;
  detectedPatterns: string[];
  message?: string;
}

export interface ScriptSafetyResult {
  isSafe: boolean;
  flaggedCommands: string[];
  reasons: string[];
}

export interface SandboxExecutionResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  isSuccess: boolean;
  executedAt: string;
}

export interface WorkbenchTaskState {
  taskId: string;
  issueNumber: number;
  repoFullName: string;
  branchName: string;
  inspection: PreCodingInspection;
  plan: ContributionPlan;
  patchDiff: string;
  diffHash: string;
  testResults?: SandboxExecutionResult;
  secretScan: SecretScanResult;
  status:
    | "INSPECTED"
    | "PLAN_APPROVED"
    | "PATCH_READY"
    | "TESTS_PASSED"
    | "TESTS_FAILED"
    | "PUSH_APPROVED"
    | "PUSHED"
    | "PR_APPROVED"
    | "PR_OPENED"
    | "ROLLED_BACK";
  pushApprovalId?: string;
  prApprovalId?: string;
  prNumber?: number;
  prUrl?: string;
}
