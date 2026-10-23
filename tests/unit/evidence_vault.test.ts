import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { CareerEvidenceVaultService } from "@/modules/vault/service";
import { prisma } from "@/lib/db";

describe("Career Evidence Vault: Source Traceability & Unsupported Claim Rejection", () => {
  let vault: CareerEvidenceVaultService;

  beforeEach(() => {
    vault = new CareerEvidenceVaultService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Source Traceability
  describe("Source Traceability", () => {
    it("should ensure every fact in the vault has an empirical source URL or locator", () => {
      const facts = vault.getAllFacts();
      expect(facts.length).toBeGreaterThanOrEqual(6);

      for (const fact of facts) {
        expect(fact.title).toBeTruthy();
        expect(fact.claimSummary).toBeTruthy();
        expect(fact.confidenceLevel).toBe("HIGH");
        const hasSource = fact.sourceUrl || fact.sourceLocator;
        expect(hasSource).toBeTruthy();
      }
    });

    it("should reject adding a fact without source provenance", () => {
      expect(() => {
        vault.addFact({
          factType: "METRIC",
          title: "Invented Metric",
          claimSummary: "No source provided",
          sourceType: "USER_CONFIRMED",
          confidenceLevel: "UNVERIFIED",
          tags: ["test"],
        });
      }).toThrow("Cannot add fact without a source provenance URL or locator.");
    });
  });

  // 2. Unsupported Claim Rejection (Zero-Fabrication Hard Rule)
  describe("Unsupported Claim Rejection", () => {
    it("should intercept and reject unverified certification claims (e.g. AWS Certified)", () => {
      const result = vault.verifyClaim("AWS Certified Solutions Architect with 5 years experience");
      expect(result.isSupported).toBe(false);
      expect(result.matchingFacts).toHaveLength(0);
      expect(result.missingEvidenceMessage).toContain("Zero evidence exists in the vault");
    });

    it("should intercept and reject unverified patent claims", () => {
      const result = vault.verifyClaim("Patented WaferOS edge anomaly detection algorithm");
      expect(result.isSupported).toBe(false);
      expect(result.missingEvidenceMessage).toContain("Zero evidence exists in the vault");
    });

    it("should intercept and reject exaggerated metrics (e.g. '100x faster', '10x revenue')", () => {
      const result = vault.verifyClaim("Delivered 100x faster inference and 10x revenue");
      expect(result.isSupported).toBe(false);
      expect(result.missingEvidenceMessage).toContain("Zero evidence exists in the vault");
    });

    it("should approve verified claims supported by vault facts (e.g. WaferOS PyTorch CNN)", () => {
      const result = vault.verifyClaim("Built WaferOS modular PyTorch pipeline for wafer defect classification");
      expect(result.isSupported).toBe(true);
      expect(result.matchingFacts.length).toBeGreaterThan(0);
      expect(result.matchingFacts[0].id).toBe("fact-proj-waferos");
    });

    it("should approve verified claims supported by LeetCode consistency", () => {
      const result = vault.verifyClaim("Solved 87+ LeetCode algorithmic problems with a 107-day streak");
      expect(result.isSupported).toBe(true);
      expect(result.matchingFacts[0].id).toBe("fact-metric-leetcode");
    });
  });

  // 3. Privacy & Career Memory
  describe("Privacy of Career Notes", () => {
    it("should strictly redact private career notes when retrieved for outward-facing contexts", () => {
      const publicPrefs = vault.getPreferences(false);
      expect(publicPrefs.privateNotes).toContain("[REDACTED_PRIVATE_CAREER_NOTES]");
      expect(publicPrefs.privateNotes).not.toContain("unpaid trial tasks");
    });

    it("should preserve private career notes only when explicitly requested for internal private memory", () => {
      const internalPrefs = vault.getPreferences(true);
      expect(internalPrefs.privateNotes).toContain("Do not apply to unverified startups");
    });
  });
});
