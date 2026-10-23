import { z } from "zod";
import { ProviderResponse, ProviderError } from "../types";

export interface AISchemaPrompt<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodSchema<T>;
  maxTokens?: number;
  temperature?: number;
}

export interface IAIModelAdapter {
  generateStructuredOutput<T>(input: AISchemaPrompt<T>): Promise<ProviderResponse<T>>;
}

export class MockAIModelAdapter implements IAIModelAdapter {
  public simulateOutage = false;
  public simulateRateLimit = false;

  async generateStructuredOutput<T>(input: AISchemaPrompt<T>): Promise<ProviderResponse<T>> {
    const timestamp = new Date().toISOString();

    if (this.simulateOutage) {
      return {
        success: false,
        error: {
          code: "PROVIDER_OUTAGE",
          message: "AI Provider API is temporarily overloaded (HTTP 503).",
          provider: "AI_MODEL",
          retryable: true,
          statusCode: 503,
        },
        meta: { provider: "AI_MODEL", timestamp },
      };
    }

    if (this.simulateRateLimit) {
      return {
        code: "RATE_LIMITED",
        message: "AI Token quota exceeded for this minute.",
        provider: "AI_MODEL",
        retryable: true,
        statusCode: 429,
      } as any;
    }

    // Default mock response: If prompt asks for score or draft, return safe mock
    const mockOutput = {
      overallFitScore: 92.5,
      roleScore: 95.0,
      skillsScore: 90.0,
      eligibilityScore: 100.0,
      recencyScore: 95.0,
      matchedSkills: ["TypeScript", "SQL", "Git", "DSA"],
      missingSkills: ["Go (Basic familiarity)"],
      rationale: "Strong alignment with backend architecture, data structures, and 2027 graduation timeline.",
    };

    return {
      success: true,
      data: mockOutput as unknown as T,
      meta: {
        provider: "AI_MODEL",
        timestamp,
        rateLimitRemaining: 980,
      },
    };
  }
}
