import { QualityAnalysisResult, ReviewChecklist } from "./types";

// Patterns flagged as engagement bait or generic corporate spam
const SPAM_HOOK_PATTERNS = [
  /thrilled to announce/i,
  /humbled and honored/i,
  /excited to share that i/i,
  /agree\?\s*(👇|\?)/i,
  /comment\s+["']?(agree|interested|yes)["']?/i,
  /thoughts\?\s*👇/i,
  /like and repost/i,
  /let that sink in/i,
  /read until the end/i,
  /drop a comment/i,
];

// Hyperbolic and overblown claims unsuited for an engineering student
const HYPERBOLIC_CLAIM_PATTERNS = [
  /revolutionizing/i,
  /groundbreaking/i,
  /game-changing/i,
  /unparalleled/i,
  /world['’]s best/i,
  /100x (faster|better|more efficient)/i,
  /flawless architecture/i,
  /guaranteed 100%/i,
];

// Sensitive tokens, keys, and PII
const SENSITIVE_PATTERNS = [
  /ghp_[a-zA-Z0-9]{36}/,
  /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}/,
  /-----BEGIN (?:RSA|EC) PRIVATE KEY-----/,
  /AKIA[0-9A-Z]{16}/,
  /password\s*=\s*['"][^'"]+['"]/i,
];

/**
 * Counts unicode emoji characters in a string
 */
export function countEmojis(text: string): number {
  // Regex matching standard emoji ranges and symbols
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu;
  const matches = text.match(emojiRegex);
  return matches ? matches.length : 0;
}

/**
 * Validates hashtags according to CareerOS guidelines:
 * - Must be between 3 and 5 hashtags
 * - Must start with '#'
 */
export function validateHashtags(hashtags: string[]): { isValid: boolean; message?: string } {
  if (hashtags.length < 3) {
    return { isValid: false, message: `Too few hashtags (${hashtags.length}). Minimum is 3.` };
  }
  if (hashtags.length > 5) {
    return { isValid: false, message: `Too many hashtags (${hashtags.length}). Maximum allowed is 5.` };
  }
  const malformed = hashtags.find((tag) => !tag.startsWith("#") || tag.length < 2);
  if (malformed) {
    return { isValid: false, message: `Malformed hashtag: "${malformed}". Must start with "#".` };
  }
  return { isValid: true };
}

/**
 * Checks for duplicate or overly similar topics in recent posts (within 14-30 days)
 */
export function detectRepetitiveTopic(newTopic: string, recentArchiveTopics: string[]): { isRepetitive: boolean; warning?: string } {
  const normalizedNew = newTopic.toLowerCase().trim();
  const keywords = normalizedNew.split(/\s+/).filter((w) => w.length > 3);

  for (const past of recentArchiveTopics) {
    const normalizedPast = past.toLowerCase().trim();
    if (normalizedPast === normalizedNew) {
      return {
        isRepetitive: true,
        warning: `Topic "${newTopic}" is identical to a recent post: "${past}".`,
      };
    }
    // Check keyword overlap
    const sharedWords = keywords.filter((k) => normalizedPast.includes(k));
    if (sharedWords.length >= 3) {
      return {
        isRepetitive: true,
        warning: `Topic "${newTopic}" strongly overlaps with recent post "${past}" (Shared: ${sharedWords.join(", ")}). Consider rotating topics.`,
      };
    }
  }

  return { isRepetitive: false };
}

/**
 * Comprehensive quality and policy analyzer for LinkedIn post content
 */
export function analyzePostQuality(content: string, hashtags: string[], hasVerifiedEvidence: boolean): QualityAnalysisResult {
  // 1. Spam hooks
  const spamHooksFound: string[] = [];
  for (const pattern of SPAM_HOOK_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      spamHooksFound.push(match[0]);
    }
  }

  // 2. Hyperbolic claims
  const hyperbolicClaimsFound: string[] = [];
  for (const pattern of HYPERBOLIC_CLAIM_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      hyperbolicClaimsFound.push(match[0]);
    }
  }

  // 3. Sensitive patterns
  const sensitivePatternsFound: string[] = [];
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(content)) {
      sensitivePatternsFound.push(pattern.source);
    }
  }

  // 4. Emoji count
  const emojiCount = countEmojis(content);

  // 5. Hashtag validation
  const hashtagVal = validateHashtags(hashtags);

  // 6. Character count
  const characterCount = content.length;
  const characterCountValid = characterCount > 50 && characterCount <= 3000;

  const checklist: ReviewChecklist = {
    evidenceVerified: hasVerifiedEvidence,
    characterCountValid,
    toneModest: hyperbolicClaimsFound.length === 0,
    noSpamHooks: spamHooksFound.length === 0,
    noExcessEmojis: emojiCount <= 4,
    hashtagCountValid: hashtagVal.isValid,
    noSensitiveData: sensitivePatternsFound.length === 0,
  };

  const isValid =
    checklist.evidenceVerified &&
    checklist.characterCountValid &&
    checklist.toneModest &&
    checklist.noSpamHooks &&
    checklist.noExcessEmojis &&
    checklist.hashtagCountValid &&
    checklist.noSensitiveData;

  return {
    isValid,
    spamHooksFound,
    emojiCount,
    hashtagCount: hashtags.length,
    hyperbolicClaimsFound,
    sensitivePatternsFound,
    checklist,
  };
}
