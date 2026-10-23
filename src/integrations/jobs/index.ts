import { ProviderResponse, ProviderError } from "../types";
import { computeHash } from "@/lib/crypto";

export interface NormalizedJobOpening {
  id: string;
  source: "ASHBY" | "GREENHOUSE" | "LEVER" | "COMPANY_PAGE";
  canonicalUrl: string;
  companyName: string;
  roleTitle: string;
  location: string;
  workMode: "REMOTE" | "HYBRID" | "ON_SITE";
  roleType: "INTERN" | "FULL_TIME";
  description: string;
  dedupeHash: string;
  postedAt: string;
}

export interface JobSearchQuery {
  keywords: string[];
  locations: string[];
  internshipsOnly?: boolean;
}

export interface IJobSourceAdapter {
  searchListings(query: JobSearchQuery): Promise<ProviderResponse<NormalizedJobOpening[]>>;
  getListing(canonicalUrl: string): Promise<ProviderResponse<NormalizedJobOpening>>;
}

export class MockJobSourceAdapter implements IJobSourceAdapter {
  public simulateOutage = false;
  public simulateRateLimit = false;

  async searchListings(query: JobSearchQuery): Promise<ProviderResponse<NormalizedJobOpening[]>> {
    const timestamp = new Date().toISOString();

    if (this.simulateOutage) {
      return {
        success: false,
        error: {
          code: "PROVIDER_OUTAGE",
          message: "Job feed endpoint returned HTTP 503.",
          provider: "JOB_SEARCH",
          retryable: true,
          statusCode: 503,
        },
        meta: { provider: "JOB_SEARCH", timestamp },
      };
    }

    if (this.simulateRateLimit) {
      return {
        success: false,
        error: {
          code: "RATE_LIMITED",
          message: "Feed polling rate limit exceeded.",
          provider: "JOB_SEARCH",
          retryable: true,
          statusCode: 429,
        },
        meta: { provider: "JOB_SEARCH", timestamp },
      };
    }

    const sampleListings: NormalizedJobOpening[] = [
      {
        id: "job-stripe-001",
        source: "GREENHOUSE",
        canonicalUrl: "https://boards.greenhouse.io/demo/jobs/backend-intern-2025",
        companyName: "Stripe",
        roleTitle: "Software Engineering Intern - Infrastructure",
        location: "Remote (India)",
        workMode: "REMOTE",
        roleType: "INTERN",
        description: "Build robust distributed backend payment rails in Go, TypeScript, and SQL. Open to 2026/2027 graduates.",
        dedupeHash: computeHash("stripe-backend-intern-2025"),
        postedAt: "2026-10-18T00:00:00Z",
      },
      {
        id: "job-datadog-002",
        source: "LEVER",
        canonicalUrl: "https://jobs.lever.co/demo/datadog-systems-intern",
        companyName: "Datadog",
        roleTitle: "Systems Software Engineer Intern",
        location: "Bengaluru, India",
        workMode: "HYBRID",
        roleType: "INTERN",
        description: "Work on high-throughput telemetry pipelines and agent collectors in Go and Python.",
        dedupeHash: computeHash("datadog-systems-intern-2025"),
        postedAt: "2026-10-17T00:00:00Z",
      },
    ];

    return {
      success: true,
      data: sampleListings,
      meta: {
        provider: "JOB_SEARCH",
        timestamp,
        sourceUrl: "https://boards.greenhouse.io/",
      },
    };
  }

  async getListing(canonicalUrl: string): Promise<ProviderResponse<NormalizedJobOpening>> {
    const timestamp = new Date().toISOString();

    return {
      success: true,
      data: {
        id: "job-stripe-001",
        source: "GREENHOUSE",
        canonicalUrl,
        companyName: "Stripe",
        roleTitle: "Software Engineering Intern - Infrastructure",
        location: "Remote (India)",
        workMode: "REMOTE",
        roleType: "INTERN",
        description: "Build robust distributed backend payment rails in Go, TypeScript, and SQL. Open to 2026/2027 graduates.",
        dedupeHash: computeHash("stripe-backend-intern-2025"),
        postedAt: "2026-10-18T00:00:00Z",
      },
      meta: { provider: "JOB_SEARCH", timestamp, sourceUrl: canonicalUrl },
    };
  }
}
