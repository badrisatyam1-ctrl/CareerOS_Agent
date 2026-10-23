import {
  EvidenceFactItem,
  CareerPreferencesData,
  ClaimVerificationResult,
} from "./types";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

export class CareerEvidenceVaultService {
  private facts: EvidenceFactItem[] = [
    {
      id: "fact-edu-gcet-2028",
      factType: "EDUCATION",
      title: "B.Tech in Electronics & Communication Engineering",
      claimSummary: "Currently enrolled in 3rd year B.Tech in Electronics & Communication Engineering (ECE) at Galgotias College of Engineering & Technology (GCET), graduating in 2028.",
      sourceType: "USER_CONFIRMED",
      sourceUrl: "https://portfolio-bjzy.vercel.app/",
      sourceLocator: "User Confirmed Enrollment: GCET ECE 3rd Year (Class of 2028)",
      confidenceLevel: "HIGH",
      lastVerifiedAt: "2026-10-22T02:00:00Z",
      userConfirmedAt: "2026-10-22T02:00:00Z",
      tags: ["education", "btech", "ece", "gcet", "2028"],
    },
    {
      id: "fact-proj-waferos",
      factType: "PROJECT",
      title: "WaferOS: Semiconductor Wafer Defect Classification",
      claimSummary: "Modular PyTorch pipeline for multi-class wafer defect recognition, handling 90%+ class imbalance with synthetic augmentations.",
      sourceType: "GITHUB_REPO",
      sourceUrl: "https://github.com/badrisatyam1-ctrl/wafer-defect-classification",
      sourceLocator: "README.md & benchmarks/inference.py",
      confidenceLevel: "HIGH",
      lastVerifiedAt: "2026-10-21T19:00:00Z",
      userConfirmedAt: "2026-10-21T19:00:00Z",
      tags: ["pytorch", "computer-vision", "defect-classification", "python", "docker"],
    },
    {
      id: "fact-proj-travelbooking",
      factType: "PROJECT",
      title: "TravelBooking: Distributed Seat Reservation System",
      claimSummary: "Engineered ticket reservation engine using Redis lease locks with 120s TTL to prevent concurrent double-booking.",
      sourceType: "GITHUB_REPO",
      sourceUrl: "https://github.com/badrisatyam1-ctrl/TravelBooking",
      sourceLocator: "src/lib/locks.ts & API routes",
      confidenceLevel: "HIGH",
      lastVerifiedAt: "2026-10-21T19:00:00Z",
      userConfirmedAt: "2026-10-21T19:00:00Z",
      tags: ["typescript", "redis", "postgresql", "concurrency", "distributed-systems"],
    },
    {
      id: "fact-proj-smarthelmet",
      factType: "PROJECT",
      title: "Smart Helmet: Real-Time Accident Detection",
      claimSummary: "Programmed ESP32 microcontroller with accelerometer and gyroscope sensors for crash detection and emergency SMS broadcast.",
      sourceType: "GITHUB_REPO",
      sourceUrl: "https://github.com/badrisatyam1-ctrl/SmartHelmet",
      sourceLocator: "firmware/main.cpp",
      confidenceLevel: "HIGH",
      lastVerifiedAt: "2026-10-21T19:00:00Z",
      userConfirmedAt: "2026-10-21T19:00:00Z",
      tags: ["embedded-c", "cpp", "esp32", "iot", "sensors"],
    },
    {
      id: "fact-metric-leetcode",
      factType: "METRIC",
      title: "LeetCode Consistency & Problem Solving",
      claimSummary: "Solved 184 data structure and algorithm problems (118 Easy, 62 Medium, 4 Hard) across a 190-day consecutive streak (246 total active days, 200 Days Badge 2026, 1,550 contest rating) on LeetCode.",
      sourceType: "CREDENTIAL_URL",
      sourceUrl: "https://leetcode.com/u/Badri1888/",
      sourceLocator: "Profile: @Badri1888",
      confidenceLevel: "HIGH",
      lastVerifiedAt: "2026-10-22T02:00:00Z",
      userConfirmedAt: "2026-10-22T02:00:00Z",
      tags: ["leetcode", "dsa", "algorithms", "problem-solving", "184-solved", "190-streak"],
    },
    {
      id: "fact-pr-waferos-benchmark",
      factType: "VERIFIED_GITHUB_PR",
      title: "Batch Inference Benchmark Module (PR #4)",
      claimSummary: "Authored and merged PR #4 into wafer-defect-classification adding isolated batch latency and throughput profiling.",
      sourceType: "GITHUB_PR",
      sourceUrl: "https://github.com/badrisatyam1-ctrl/wafer-defect-classification/pull/4",
      sourceLocator: "PR #4 (merged)",
      confidenceLevel: "HIGH",
      lastVerifiedAt: "2026-10-21T20:00:00Z",
      userConfirmedAt: "2026-10-21T20:00:00Z",
      tags: ["open-source", "pull-request", "benchmarking", "profiling"],
    },
  ];

  private preferences: CareerPreferencesData = {
    targetRoles: [
      "Software Engineering Intern (Infrastructure / Backend)",
      "Computer Vision / Edge AI Intern",
      "Embedded Systems / IoT Engineer Intern",
    ],
    preferredLocations: [
      "Greater Noida, India",
      "Noida, India",
      "Delhi NCR, India",
      "Remote (India-wide / Global)",
    ],
    targetCompanies: ["Stripe", "Qualcomm", "Datadog", "Texas Instruments", "Cloudflare"],
    salaryFloorMonthlyInr: 40000,
    tone: {
      primaryTone: "HUMBLE_TECHNICAL",
      avoidBuzzwords: true,
      maxEmojisPerPost: 4,
    },
    privateNotes: "Focus on learning distributed systems internals and edge quantization. Do not apply to unverified startups asking for unpaid trial tasks.",
    lastUpdated: "2026-10-21T18:00:00Z",
  };

  /**
   * Retrieves all verified facts in the career evidence vault
   */
  public getAllFacts(typeFilter?: string): EvidenceFactItem[] {
    if (typeFilter && typeFilter !== "ALL") {
      return this.facts.filter((f) => f.factType === typeFilter);
    }
    return [...this.facts];
  }

  /**
   * Queries the evidence vault for supporting facts.
   * STRICT RULE: If a claim is not supported by vault facts, writing agents must ask or omit it.
   */
  public verifyClaim(claimText: string): ClaimVerificationResult {
    const textLower = claimText.toLowerCase();

    // Check against disallowed/unsupported claims
    const unsupportedKeywords = [
      "patent",
      "aws certified",
      "gcp architect",
      "azure certified",
      "phd",
      "kubernetes cluster lead",
      "10x revenue",
      "100x faster",
      "5 years production experience",
    ];

    for (const kw of unsupportedKeywords) {
      if (textLower.includes(kw)) {
        return {
          isSupported: false,
          matchingFacts: [],
          missingEvidenceMessage: `Claim contains unverified statement ("${kw}"). Zero evidence exists in the vault. CareerOS strictly omits this claim.`,
        };
      }
    }

    // Match against verified vault tags and titles
    const matching = this.facts.filter((f) => {
      const matchInTags = f.tags.some((tag) => textLower.includes(tag));
      const matchInTitle = textLower.includes(f.title.toLowerCase());
      return matchInTags || matchInTitle;
    });

    if (matching.length === 0) {
      return {
        isSupported: false,
        matchingFacts: [],
        missingEvidenceMessage: `No evidence in vault supports this claim. Provide a source URL or omit the statement.`,
      };
    }

    return {
      isSupported: true,
      matchingFacts: matching,
    };
  }

  /**
   * Adds a newly verified fact to the vault
   */
  public addFact(fact: Omit<EvidenceFactItem, "id" | "lastVerifiedAt">): EvidenceFactItem {
    if (!fact.sourceUrl && !fact.sourceLocator) {
      throw new Error("Cannot add fact without a source provenance URL or locator.");
    }

    const newFact: EvidenceFactItem = {
      ...fact,
      id: `fact-${Date.now()}`,
      lastVerifiedAt: new Date().toISOString(),
    };

    this.facts.push(newFact);
    logger.info("EVIDENCE_VAULT", `Added new verified fact: ${newFact.title}`, { factId: newFact.id });
    return newFact;
  }

  /**
   * Retrieves user career preferences, omitting private notes for outward-facing contexts
   */
  public getPreferences(includePrivateNotes: boolean = false): CareerPreferencesData {
    if (!includePrivateNotes) {
      return {
        ...this.preferences,
        privateNotes: "[REDACTED_PRIVATE_CAREER_NOTES]",
      };
    }
    return { ...this.preferences };
  }

  /**
   * Updates user preferences
   */
  public updatePreferences(newPrefs: Partial<CareerPreferencesData>): CareerPreferencesData {
    this.preferences = {
      ...this.preferences,
      ...newPrefs,
      lastUpdated: new Date().toISOString(),
    };
    logger.info("EVIDENCE_VAULT", "Updated user career preferences");
    return { ...this.preferences };
  }
}
