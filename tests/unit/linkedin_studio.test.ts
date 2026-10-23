import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { LinkedInStudioService } from "@/modules/linkedin/service";
import {
  analyzePostQuality,
  countEmojis,
  validateHashtags,
  detectRepetitiveTopic,
} from "@/modules/linkedin/quality";
import { prisma } from "@/lib/db";

describe("LinkedIn Content Studio: Quality, Safety & Policy Tests", () => {
  let service: LinkedInStudioService;

  beforeEach(() => {
    service = new LinkedInStudioService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Spam Hook Detection
  describe("Spam Hook Detection", () => {
    it("should flag generic corporate 'thrilled to announce' openings", () => {
      const spamPost = "I am thrilled to announce that I have completed a new benchmark!";
      const result = analyzePostQuality(spamPost, ["#AI", "#Python", "#ML"], true);
      expect(result.isValid).toBe(false);
      expect(result.spamHooksFound).toContain("thrilled to announce");
      expect(result.checklist.noSpamHooks).toBe(false);
    });

    it("should flag engagement bait hooks like 'Agree? 👇'", () => {
      const baitPost = "Clean architecture is better than fast code. Agree? 👇";
      const result = analyzePostQuality(baitPost, ["#Coding", "#Software", "#Engineering"], true);
      expect(result.isValid).toBe(false);
      expect(result.checklist.noSpamHooks).toBe(false);
    });

    it("should pass authentic engineering explanations with zero spam hooks", () => {
      const cleanPost = "In WaferOS, we observed that weighted cross entropy prevented naive model collapse on skewed defect distributions.";
      const result = analyzePostQuality(cleanPost, ["#PyTorch", "#DeepLearning", "#ComputerVision"], true);
      expect(result.spamHooksFound).toHaveLength(0);
      expect(result.checklist.noSpamHooks).toBe(true);
    });
  });

  // 2. Emoji Count Limits
  describe("Emoji Count Guard", () => {
    it("should count emojis correctly", () => {
      const text = "Great project! 🚀 💡 🔥 💻";
      expect(countEmojis(text)).toBe(4);
    });

    it("should flag post with excess emojis (> 4 emojis)", () => {
      const emojiOverload = "Super excited! 🚀 💡 🔥 💻 ✨ 🎯";
      const result = analyzePostQuality(emojiOverload, ["#AI", "#Tech", "#Code"], true);
      expect(result.emojiCount).toBe(6);
      expect(result.checklist.noExcessEmojis).toBe(false);
      expect(result.isValid).toBe(false);
    });

    it("should approve post with modest emojis (<= 4 emojis)", () => {
      const modestEmoji = "Here is our benchmark breakdown: 📊";
      const result = analyzePostQuality(modestEmoji, ["#AI", "#Tech", "#Code"], true);
      expect(result.emojiCount).toBe(1);
      expect(result.checklist.noExcessEmojis).toBe(true);
    });
  });

  // 3. Hashtag Bounds (3 to 5 tags)
  describe("Hashtag Bounds Enforcement", () => {
    it("should reject post with fewer than 3 hashtags", () => {
      const val = validateHashtags(["#AI", "#Python"]);
      expect(val.isValid).toBe(false);
      expect(val.message).toContain("Too few hashtags");
    });

    it("should reject post with more than 5 hashtags", () => {
      const val = validateHashtags(["#AI", "#ML", "#Python", "#Data", "#DeepLearning", "#Tech"]);
      expect(val.isValid).toBe(false);
      expect(val.message).toContain("Too many hashtags");
    });

    it("should reject malformed hashtags without hash prefix", () => {
      const val = validateHashtags(["#AI", "Python", "#ML"]);
      expect(val.isValid).toBe(false);
      expect(val.message).toContain("Malformed hashtag");
    });

    it("should accept valid list of 3-5 well-formed hashtags", () => {
      const val = validateHashtags(["#AI", "#Python", "#MachineLearning", "#OpenSource"]);
      expect(val.isValid).toBe(true);
    });
  });

  // 4. Hyperbolic & Unsupported Claims
  describe("Hyperbolic Claim Guard", () => {
    it("should flag hyperbolic claims like 'revolutionizing' or '100x faster'", () => {
      const hypePost = "Our new wafer inspection model is revolutionizing the semiconductor industry with 100x faster inference!";
      const result = analyzePostQuality(hypePost, ["#AI", "#ML", "#Chips"], true);
      expect(result.hyperbolicClaimsFound.length).toBeGreaterThan(0);
      expect(result.checklist.toneModest).toBe(false);
      expect(result.isValid).toBe(false);
    });

    it("should pass modest, concrete engineering claims", () => {
      const modestPost = "In our PyTorch tests, weighted cross entropy reduced class-skew false positives by stabilizing loss gradients.";
      const result = analyzePostQuality(modestPost, ["#PyTorch", "#MachineLearning", "#ComputerVision"], true);
      expect(result.hyperbolicClaimsFound).toHaveLength(0);
      expect(result.checklist.toneModest).toBe(true);
    });
  });

  // 5. Sensitive Data Scanning
  describe("Sensitive Data Scanner", () => {
    it("should detect GitHub Personal Access Tokens in post drafts", () => {
      const leakedPost = "Configured test runs with token: ghp_1234567890abcdefghijklmnopqrstuvwxyz1234";
      const result = analyzePostQuality(leakedPost, ["#Security", "#Code", "#DevOps"], true);
      expect(result.checklist.noSensitiveData).toBe(false);
      expect(result.isValid).toBe(false);
    });

    it("should detect private RSA keys in post drafts", () => {
      const leakedKey = "Deploy script: -----BEGIN RSA PRIVATE KEY----- MIIE...";
      const result = analyzePostQuality(leakedKey, ["#Security", "#DevOps", "#Cloud"], true);
      expect(result.checklist.noSensitiveData).toBe(false);
      expect(result.isValid).toBe(false);
    });
  });

  // 6. Repetitive Topic Detection
  describe("Repetitive Topic Sentinel", () => {
    it("should flag identical topics to recent archive posts", () => {
      const archive = ["Introduction to WaferOS Defect Architecture"];
      const check = detectRepetitiveTopic("Introduction to WaferOS Defect Architecture", archive);
      expect(check.isRepetitive).toBe(true);
      expect(check.warning).toContain("identical to a recent post");
    });

    it("should flag heavily overlapping topics posted within the same rotation cycle", () => {
      const archive = ["WaferOS Defect Architecture and PyTorch Pipeline"];
      const check = detectRepetitiveTopic("WaferOS Defect Architecture Benchmarking", archive);
      expect(check.isRepetitive).toBe(true);
      expect(check.warning).toContain("strongly overlaps");
    });

    it("should permit rotated distinct technical topics", () => {
      const archive = ["Introduction to WaferOS Defect Architecture"];
      const check = detectRepetitiveTopic("Distributed Redis Locks in TravelBooking Engine", archive);
      expect(check.isRepetitive).toBe(false);
    });
  });

  // 7. Plan Generation, Approval & Manual Handoff
  describe("LinkedIn Studio Service Workflow", () => {
    it("should generate 3 candidate drafts rotated among verified themes", () => {
      const plan = service.generateWeeklyPlan("demo-user-badri");
      expect(plan.candidates).toHaveLength(3);
      expect(plan.themeRotation).toContain("BUILD_LOG");
      expect(plan.themeRotation).toContain("DEBUGGING_TRADEOFF");
      expect(plan.themeRotation).toContain("DSA_LEARNING");
    });

    it("should verify all 3 generated candidates pass quality policy checklist", () => {
      const plan = service.generateWeeklyPlan("demo-user-badri");
      for (const draft of plan.candidates) {
        expect(draft.reviewChecklist.evidenceVerified).toBe(true);
        expect(draft.reviewChecklist.noSpamHooks).toBe(true);
        expect(draft.reviewChecklist.toneModest).toBe(true);
        expect(draft.reviewChecklist.noExcessEmojis).toBe(true);
        expect(draft.reviewChecklist.hashtagCountValid).toBe(true);
        expect(draft.reviewChecklist.noSensitiveData).toBe(true);
      }
    });

    it("should compute SHA-256 approvalHash upon approval and update learned tone", async () => {
      const plan = service.generateWeeklyPlan("demo-user-badri");
      const draft = plan.candidates[0];

      const initialCount = service.getTonePreferences().approvedDraftsCount;
      const approval = await service.approveDraft("demo-user-badri", draft);

      expect(approval.success).toBe(true);
      expect(draft.status).toBe("APPROVED");
      expect(draft.approvalHash).toHaveLength(64); // SHA-256 hex string

      // Tone preferences updated only from approved posts
      expect(service.getTonePreferences().approvedDraftsCount).toBe(initialCount + 1);
    });

    it("should provide safe manual handoff without automated API posting", () => {
      const plan = service.generateWeeklyPlan("demo-user-badri");
      const draft = plan.candidates[0];

      const handoff = service.getHandoffPayload(draft);
      expect(handoff.targetFeedUrl).toBe("https://www.linkedin.com/feed/?shareActive=true");
      expect(handoff.clipboardText).toBe(draft.content);
    });
  });
});
