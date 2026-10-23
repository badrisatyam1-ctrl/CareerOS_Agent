import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getIntegrationMode,
  transitionIntegrationMode,
  isWriteAllowed,
  isRealMode,
  getModeLabel,
  getModeColor,
} from "@/integrations/mode";
import { RealGitHubAdapter } from "@/integrations/github/real";
import { RealGmailAdapter } from "@/integrations/gmail/real";
import { createGitHubAdapter, createGmailAdapter } from "@/integrations/factory";
import { computeHash } from "@/lib/crypto";

import { prisma } from "@/lib/db";

describe("CareerOS Integration Mode State Machine", () => {
  it("should default to DEMO mode when no real account is connected", async () => {
    vi.spyOn(prisma.connectedAccount, "findFirst").mockResolvedValueOnce(null);
    const state = await getIntegrationMode("GITHUB");
    expect(state.provider).toBe("GITHUB");
    expect(state.mode).toBe("DEMO");
  });

  it("should identify write allowance correctly per level", () => {
    expect(isWriteAllowed("DEMO")).toBe(false);
    expect(isWriteAllowed("REAL_CONNECTED_READ_ONLY")).toBe(false);
    expect(isWriteAllowed("REAL_DRAFT_ONLY")).toBe(false);
    expect(isWriteAllowed("REAL_APPROVAL_REQUIRED")).toBe(true);
    expect(isWriteAllowed("REAL_WRITE_ENABLED")).toBe(true);
  });

  it("should identify real mode versus demo mode correctly", () => {
    expect(isRealMode("DEMO")).toBe(false);
    expect(isRealMode("REAL_CONNECTED_READ_ONLY")).toBe(true);
    expect(isRealMode("REAL_DRAFT_ONLY")).toBe(true);
    expect(isRealMode("REAL_APPROVAL_REQUIRED")).toBe(true);
    expect(isRealMode("REAL_WRITE_ENABLED")).toBe(true);
  });

  it("should provide labels and color styling for all 5 progression levels", () => {
    const modes = [
      "DEMO",
      "REAL_CONNECTED_READ_ONLY",
      "REAL_DRAFT_ONLY",
      "REAL_APPROVAL_REQUIRED",
      "REAL_WRITE_ENABLED",
    ] as const;

    for (const m of modes) {
      expect(getModeLabel(m)).toBeDefined();
      expect(getModeColor(m)).toContain("border");
    }
  });

  it("should block invalid direct progression skipping levels", async () => {
    await expect(
      transitionIntegrationMode("test-user", "GITHUB", "REAL_WRITE_ENABLED")
    ).rejects.toThrow(/Invalid transition/);
  });
});

describe("Real GitHub Adapter Mode Gating", () => {
  it("should block openPR in READ_ONLY mode", async () => {
    const adapter = new RealGitHubAdapter("fake-token", "REAL_CONNECTED_READ_ONLY");

    const res = await adapter.openPullRequest({
      repo: "badrisatyam1-ctrl/wafer-defect-classification",
      title: "Add benchmark profile",
      body: "Testing PR creation gate",
      baseRef: "main",
      headRef: "feat/benchmark",
      diffHash: "hash-123",
      approvalToken: {
        approvalId: "app-1",
        contentHash: "hash-123",
        isApproved: true,
      },
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(res.error?.message).toContain("REAL_CONNECTED_READ_ONLY");
  });

  it("should block openPR in DRAFT_ONLY mode", async () => {
    const adapter = new RealGitHubAdapter("fake-token", "REAL_DRAFT_ONLY");

    const res = await adapter.openPullRequest({
      repo: "badrisatyam1-ctrl/wafer-defect-classification",
      title: "Add benchmark profile",
      body: "Testing PR creation gate",
      baseRef: "main",
      headRef: "feat/benchmark",
      diffHash: "hash-123",
      approvalToken: {
        approvalId: "app-1",
        contentHash: "hash-123",
        isApproved: true,
      },
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(res.error?.message).toContain("REAL_DRAFT_ONLY");
  });

  it("should block openPR if approval token is missing even in WRITE_ENABLED mode", async () => {
    const adapter = new RealGitHubAdapter("fake-token", "REAL_WRITE_ENABLED");

    const res = await adapter.openPullRequest({
      repo: "badrisatyam1-ctrl/wafer-defect-classification",
      title: "Add benchmark profile",
      body: "Testing PR creation gate",
      baseRef: "main",
      headRef: "feat/benchmark",
      diffHash: "hash-123",
      // @ts-expect-error test missing approval
      approvalToken: undefined,
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(res.error?.message).toContain("Action-specific approval is required");
  });

  it("should block openPR if diff hash changed after approval", async () => {
    const adapter = new RealGitHubAdapter("fake-token", "REAL_APPROVAL_REQUIRED");

    const res = await adapter.openPullRequest({
      repo: "badrisatyam1-ctrl/wafer-defect-classification",
      title: "Add benchmark profile",
      body: "Testing PR creation gate",
      baseRef: "main",
      headRef: "feat/benchmark",
      diffHash: "current-modified-diff-hash",
      approvalToken: {
        approvalId: "app-1",
        contentHash: "stale-approved-diff-hash",
        isApproved: true,
      },
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("APPROVAL_MISMATCH");
    expect(res.error?.message).toContain("Diff hash mismatch");
  });
});

describe("Real Gmail Adapter Mode Gating", () => {
  it("should block createEmailDraft in READ_ONLY mode", async () => {
    const adapter = new RealGmailAdapter("fake-token", "REAL_CONNECTED_READ_ONLY");

    const res = await adapter.createEmailDraft({
      to: "recruiter@example.com",
      subject: "Internship Inquiry",
      body: "Draft body text",
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(res.error?.message).toContain("READ_ONLY");
  });

  it("should block sendApprovedEmail in DRAFT_ONLY mode", async () => {
    const adapter = new RealGmailAdapter("fake-token", "REAL_DRAFT_ONLY");
    const body = "Draft body text";
    const contentHash = computeHash(body);

    const res = await adapter.sendApprovedEmail({
      draftId: "draft-1",
      to: "recruiter@example.com",
      subject: "Internship Inquiry",
      body,
      approvalToken: {
        approvalId: "app-1",
        contentHash,
        isApproved: true,
      },
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("INSUFFICIENT_PERMISSIONS");
    expect(res.error?.message).toContain("REAL_DRAFT_ONLY");
  });

  it("should block sendApprovedEmail if content hash does not match approved hash", async () => {
    const adapter = new RealGmailAdapter("fake-token", "REAL_APPROVAL_REQUIRED");

    const res = await adapter.sendApprovedEmail({
      draftId: "draft-1",
      to: "recruiter@example.com",
      subject: "Internship Inquiry",
      body: "Modified body text after approval",
      approvalToken: {
        approvalId: "app-1",
        contentHash: computeHash("Original approved body text"),
        isApproved: true,
      },
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("APPROVAL_MISMATCH");
    expect(res.error?.message).toContain("Content hash mismatch");
  });
});

describe("Adapter Factory", () => {
  it("should return MockGitHubAdapter when in DEMO mode", async () => {
    const { adapter, mode } = await createGitHubAdapter();
    expect(mode).toBe("DEMO");
    expect(adapter).toBeDefined();
  });

  it("should return MockGmailAdapter when in DEMO mode", async () => {
    const { adapter, mode } = await createGmailAdapter();
    expect(mode).toBe("DEMO");
    expect(adapter).toBeDefined();
  });
});
