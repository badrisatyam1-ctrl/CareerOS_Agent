/**
 * CareerOS Real GitHub Adapter
 *
 * Makes authenticated requests to the GitHub REST API using the decrypted
 * OAuth access token from the ConnectedAccount table.
 *
 * Respects the integration mode:
 *  - READ_ONLY modes: listRepositories, listIssues, getTrending
 *  - DRAFT/APPROVAL modes: all reads + openPR (gated by approval token)
 *  - WRITE_ENABLED: all operations
 *
 * All responses conform to the ProviderResponse<T> interface.
 */

import {
  IGitHubAdapter,
  GitHubRepo,
  GitHubIssue,
  GitHubPR,
  TrendingRepo,
  OpenPRInput,
  RequestOptions,
} from "./index";
import { ProviderResponse, ProviderError } from "../types";
import { type IntegrationMode, isWriteAllowed } from "../mode";
import { logger } from "@/lib/logger";

const GITHUB_API = "https://api.github.com";
const USER_AGENT = "CareerOS/1.0";

export class RealGitHubAdapter implements IGitHubAdapter {
  private token: string;
  private mode: IntegrationMode;

  constructor(token: string, mode: IntegrationMode) {
    this.token = token;
    this.mode = mode;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `token ${this.token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": USER_AGENT,
    };
  }

  private meta(sourceUrl?: string): { provider: "GITHUB"; timestamp: string; sourceUrl?: string; rateLimitRemaining?: number } {
    return {
      provider: "GITHUB",
      timestamp: new Date().toISOString(),
      sourceUrl,
    };
  }

  private handleError(err: unknown, endpoint: string): ProviderError {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("REAL_GITHUB", `API error on ${endpoint}: ${message}`);

    if (message.includes("401") || message.includes("Unauthorized")) {
      return { code: "EXPIRED_CREDENTIALS", message: `GitHub token expired or invalid: ${message}`, provider: "GITHUB", retryable: false, statusCode: 401 };
    }
    if (message.includes("403") || message.includes("Forbidden")) {
      return { code: "REVOKED_ACCESS", message: `GitHub access denied: ${message}`, provider: "GITHUB", retryable: false, statusCode: 403 };
    }
    if (message.includes("429") || message.includes("rate limit")) {
      return { code: "RATE_LIMITED", message: `GitHub rate limit: ${message}`, provider: "GITHUB", retryable: true, statusCode: 429 };
    }
    return { code: "PROVIDER_OUTAGE", message, provider: "GITHUB", retryable: true, statusCode: 500 };
  }

  async listRepositories(username: string, _options?: RequestOptions): Promise<ProviderResponse<GitHubRepo[]>> {
    const url = `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`;
    try {
      const res = await fetch(url, { headers: this.headers(), signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      const repos: GitHubRepo[] = (data as Record<string, unknown>[]).map((r: Record<string, unknown>) => ({
        id: r.id as number,
        fullName: r.full_name as string,
        name: r.name as string,
        owner: (r.owner as Record<string, unknown>)?.login as string,
        htmlUrl: r.html_url as string,
        description: (r.description as string) || null,
        isPrivate: r.private as boolean,
        isFork: r.fork as boolean,
        defaultBranch: r.default_branch as string,
        starsCount: r.stargazers_count as number,
        forksCount: r.forks_count as number,
        openIssuesCount: r.open_issues_count as number,
        primaryLanguage: (r.language as string) || null,
        topics: (r.topics as string[]) || [],
        licenseSpdx: r.license ? ((r.license as Record<string, unknown>).spdx_id as string) : null,
        hasContributing: false, // Would need additional API call
        hasCi: false,
        updatedAt: r.updated_at as string,
      }));

      const remaining = res.headers.get("x-ratelimit-remaining");

      return {
        success: true,
        data: repos,
        meta: { ...this.meta(url), rateLimitRemaining: remaining ? parseInt(remaining, 10) : undefined },
      };
    } catch (err) {
      return { success: false, error: this.handleError(err, "listRepositories"), meta: this.meta(url) };
    }
  }

  async listStarredRepositories(username: string, _options?: RequestOptions): Promise<ProviderResponse<GitHubRepo[]>> {
    const url = `${GITHUB_API}/users/${encodeURIComponent(username)}/starred?per_page=10`;
    try {
      const res = await fetch(url, { headers: this.headers(), signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      const repos: GitHubRepo[] = (data as Record<string, unknown>[]).map((r: Record<string, unknown>) => ({
        id: r.id as number,
        fullName: r.full_name as string,
        name: r.name as string,
        owner: (r.owner as Record<string, unknown>)?.login as string,
        htmlUrl: r.html_url as string,
        description: (r.description as string) || null,
        isPrivate: r.private as boolean,
        isFork: r.fork as boolean,
        defaultBranch: r.default_branch as string,
        starsCount: r.stargazers_count as number,
        forksCount: r.forks_count as number,
        openIssuesCount: r.open_issues_count as number,
        primaryLanguage: (r.language as string) || null,
        topics: (r.topics as string[]) || [],
        licenseSpdx: r.license ? ((r.license as Record<string, unknown>).spdx_id as string) : null,
        hasContributing: false,
        hasCi: false,
        updatedAt: r.updated_at as string,
      }));
      return { success: true, data: repos, meta: this.meta(url) };
    } catch (err) {
      return { success: false, error: this.handleError(err, "listStarredRepositories"), meta: this.meta(url) };
    }
  }

  async listIssues(repo: string, _options?: RequestOptions): Promise<ProviderResponse<GitHubIssue[]>> {
    const url = `${GITHUB_API}/repos/${repo}/issues?state=open&per_page=30`;
    try {
      const res = await fetch(url, { headers: this.headers(), signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      const issues: GitHubIssue[] = (data as Record<string, unknown>[])
        .filter((i: Record<string, unknown>) => !(i.pull_request)) // Filter out PRs
        .map((i: Record<string, unknown>) => ({
          id: i.id as number,
          number: i.number as number,
          title: i.title as string,
          htmlUrl: i.html_url as string,
          state: (i.state as string) === "open" ? "open" as const : "closed" as const,
          body: (i.body as string) || "",
          labels: ((i.labels as Record<string, unknown>[]) || []).map((l) => (l.name as string) || ""),
          isAssigned: !!(i.assignee),
          createdAt: i.created_at as string,
          updatedAt: i.updated_at as string,
        }));
      return { success: true, data: issues, meta: this.meta(url) };
    } catch (err) {
      return { success: false, error: this.handleError(err, "listIssues"), meta: this.meta(url) };
    }
  }

  async getIssue(repo: string, issueNumber: number): Promise<ProviderResponse<GitHubIssue>> {
    const url = `${GITHUB_API}/repos/${repo}/issues/${issueNumber}`;
    try {
      const res = await fetch(url, { headers: this.headers(), signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const i = await res.json() as Record<string, unknown>;
      return {
        success: true,
        data: {
          id: i.id as number,
          number: i.number as number,
          title: i.title as string,
          htmlUrl: i.html_url as string,
          state: (i.state as string) === "open" ? "open" as const : "closed" as const,
          body: (i.body as string) || "",
          labels: ((i.labels as Record<string, unknown>[]) || []).map((l) => (l.name as string) || ""),
          isAssigned: !!(i.assignee),
          createdAt: i.created_at as string,
          updatedAt: i.updated_at as string,
        },
        meta: this.meta(url),
      };
    } catch (err) {
      return { success: false, error: this.handleError(err, "getIssue"), meta: this.meta(url) };
    }
  }

  async listUserPullRequests(username: string): Promise<ProviderResponse<GitHubPR[]>> {
    const url = `${GITHUB_API}/search/issues?q=author:${encodeURIComponent(username)}+type:pr&per_page=20&sort=updated`;
    try {
      const res = await fetch(url, { headers: this.headers(), signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const json = await res.json() as Record<string, unknown>;
      const items = (json.items as Record<string, unknown>[]) || [];
      const prs: GitHubPR[] = items.map((i: Record<string, unknown>) => {
        const prData = i.pull_request as Record<string, unknown> | undefined;
        return {
          id: i.id as number,
          number: i.number as number,
          htmlUrl: i.html_url as string,
          title: i.title as string,
          baseRef: "main",
          headRef: "",
          state: (i.state as string) === "open" ? "open" as const :
                 prData?.merged_at ? "merged" as const : "closed" as const,
          isDraft: (i.draft as boolean) || false,
          createdAt: i.created_at as string,
          updatedAt: i.updated_at as string,
        };
      });
      return { success: true, data: prs, meta: this.meta(url) };
    } catch (err) {
      return { success: false, error: this.handleError(err, "listUserPullRequests"), meta: this.meta(url) };
    }
  }

  async getPullRequest(repo: string, prNumber: number): Promise<ProviderResponse<GitHubPR>> {
    const url = `${GITHUB_API}/repos/${repo}/pulls/${prNumber}`;
    try {
      const res = await fetch(url, { headers: this.headers(), signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const p = await res.json() as Record<string, unknown>;
      const baseObj = p.base as Record<string, unknown> | undefined;
      const headObj = p.head as Record<string, unknown> | undefined;
      return {
        success: true,
        data: {
          id: p.id as number,
          number: p.number as number,
          htmlUrl: p.html_url as string,
          title: p.title as string,
          baseRef: (baseObj?.ref as string) || "main",
          headRef: (headObj?.ref as string) || "",
          state: p.merged ? "merged" as const : (p.state as string) === "open" ? "open" as const : "closed" as const,
          isDraft: (p.draft as boolean) || false,
          createdAt: p.created_at as string,
          updatedAt: p.updated_at as string,
        },
        meta: this.meta(url),
      };
    } catch (err) {
      return { success: false, error: this.handleError(err, "getPullRequest"), meta: this.meta(url) };
    }
  }

  async getTrendingRepositories(
    language: string = "python",
    timeframe: "daily" | "weekly" | "monthly" = "daily"
  ): Promise<ProviderResponse<TrendingRepo[]>> {
    // GitHub doesn't have a trending API — use search as a proxy
    const since = timeframe === "daily" ? 1 : timeframe === "weekly" ? 7 : 30;
    const date = new Date(Date.now() - since * 86400000).toISOString().split("T")[0];
    const langQuery = language && language.toLowerCase() !== "all" ? `+language:${encodeURIComponent(language)}` : "";
    const url = `${GITHUB_API}/search/repositories?q=created:>${date}${langQuery}&sort=stars&order=desc&per_page=10`;

    try {
      const res = await fetch(url, { headers: this.headers(), signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }
      const json = await res.json() as Record<string, unknown>;
      const items = (json.items as Record<string, unknown>[]) || [];
      const trending: TrendingRepo[] = items.map((r: Record<string, unknown>) => ({
        fullName: r.full_name as string,
        htmlUrl: r.html_url as string,
        description: (r.description as string) || "",
        language: (r.language as string) || language,
        starsToday: r.stargazers_count as number,
        totalStars: r.stargazers_count as number,
        forks: r.forks_count as number,
        timeframe,
        matchReason: `Trending ${language} repository created after ${date}`,
      }));
      return { success: true, data: trending, meta: this.meta(url) };
    } catch (err) {
      return { success: false, error: this.handleError(err, "getTrendingRepositories"), meta: this.meta(url) };
    }
  }

  async openPullRequest(input: OpenPRInput): Promise<ProviderResponse<GitHubPR>> {
    // Enforce integration mode gate
    if (!isWriteAllowed(this.mode)) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: `Write operation blocked: Current mode is ${this.mode}. PR creation requires REAL_APPROVAL_REQUIRED or REAL_WRITE_ENABLED.`,
          provider: "GITHUB",
          retryable: false,
          statusCode: 403,
        },
        meta: this.meta(),
      };
    }

    // Approval token check
    if (!input.approvalToken || !input.approvalToken.isApproved) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "PR creation blocked: Action-specific approval is required.",
          provider: "GITHUB",
          retryable: false,
          statusCode: 403,
        },
        meta: this.meta(),
      };
    }

    // Content hash check
    if (input.approvalToken.contentHash !== input.diffHash) {
      return {
        success: false,
        error: {
          code: "APPROVAL_MISMATCH",
          message: "Diff hash mismatch: Code changed after approval was issued.",
          provider: "GITHUB",
          retryable: false,
          statusCode: 409,
        },
        meta: this.meta(),
      };
    }

    const url = `${GITHUB_API}/repos/${input.repo}/pulls`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { ...this.headers(), "Content-Type": "application/json" },
        body: JSON.stringify({
          title: input.title,
          body: input.body,
          head: input.headRef,
          base: input.baseRef,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const p = await res.json() as Record<string, unknown>;
      const baseObj = p.base as Record<string, unknown> | undefined;
      const headObj = p.head as Record<string, unknown> | undefined;
      logger.info("REAL_GITHUB", `PR created: ${p.html_url}`, { repo: input.repo, prNumber: p.number });

      return {
        success: true,
        data: {
          id: p.id as number,
          number: p.number as number,
          htmlUrl: p.html_url as string,
          title: p.title as string,
          baseRef: (baseObj?.ref as string) || input.baseRef,
          headRef: (headObj?.ref as string) || input.headRef,
          state: "open",
          isDraft: (p.draft as boolean) || false,
          createdAt: p.created_at as string,
          updatedAt: p.updated_at as string,
        },
        meta: this.meta(p.html_url as string),
      };
    } catch (err) {
      return { success: false, error: this.handleError(err, "openPullRequest"), meta: this.meta(url) };
    }
  }
}
