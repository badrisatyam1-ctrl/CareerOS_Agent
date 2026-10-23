import { ProviderResponse, ProviderError } from "../types";

export interface GitHubRepo {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  htmlUrl: string;
  description: string | null;
  isPrivate: boolean;
  isFork: boolean;
  defaultBranch: string;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  primaryLanguage: string | null;
  topics: string[];
  licenseSpdx: string | null;
  hasContributing: boolean;
  hasCi: boolean;
  updatedAt: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  htmlUrl: string;
  state: "open" | "closed";
  body: string;
  labels: string[];
  isAssigned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubPR {
  id: number;
  number: number;
  htmlUrl: string;
  title: string;
  baseRef: string;
  headRef: string;
  state: "open" | "closed" | "merged";
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrendingRepo {
  fullName: string;
  htmlUrl: string;
  description: string;
  language: string;
  starsToday: number;
  totalStars: number;
  forks: number;
  timeframe: "daily" | "weekly" | "monthly";
  matchReason: string;
}

export interface OpenPRInput {
  repo: string;
  title: string;
  body: string;
  baseRef: string;
  headRef: string;
  diffHash: string;
  approvalToken: {
    approvalId: string;
    contentHash: string;
    isApproved: boolean;
  };
}

export interface RequestOptions {
  eTag?: string;
}

export interface IGitHubAdapter {
  listRepositories(username: string, options?: RequestOptions): Promise<ProviderResponse<GitHubRepo[]>>;
  listStarredRepositories(username: string, options?: RequestOptions): Promise<ProviderResponse<GitHubRepo[]>>;
  listIssues(repo: string, options?: RequestOptions): Promise<ProviderResponse<GitHubIssue[]>>;
  getIssue(repo: string, issueNumber: number): Promise<ProviderResponse<GitHubIssue>>;
  listUserPullRequests(username: string): Promise<ProviderResponse<GitHubPR[]>>;
  getPullRequest(repo: string, prNumber: number): Promise<ProviderResponse<GitHubPR>>;
  getTrendingRepositories(language?: string, timeframe?: "daily" | "weekly" | "monthly"): Promise<ProviderResponse<TrendingRepo[]>>;
  openPullRequest(input: OpenPRInput): Promise<ProviderResponse<GitHubPR>>;
}

export class MockGitHubAdapter implements IGitHubAdapter {
  public simulateExpired = false;
  public simulateRevoked = false;
  public simulateOutage = false;
  public simulateRateLimit = false;
  public writeCapabilityGranted = false; // Start read-only by default

  // ETag cache tracking for conditional requests
  private repoETag = '"etag-repos-v1"';
  private issueETag = '"etag-issues-v1"';

  private checkFailureModes(endpoint: string): ProviderError | null {
    if (this.simulateExpired) {
      return {
        code: "EXPIRED_CREDENTIALS",
        message: "GitHub OAuth access token has expired. Re-authentication required.",
        provider: "GITHUB",
        retryable: false,
        statusCode: 401,
      };
    }
    if (this.simulateRevoked) {
      return {
        code: "REVOKED_ACCESS",
        message: "GitHub integration access was revoked by user on github.com.",
        provider: "GITHUB",
        retryable: false,
        statusCode: 403,
      };
    }
    if (this.simulateOutage) {
      return {
        code: "PROVIDER_OUTAGE",
        message: "GitHub API is currently returning 503 Service Unavailable.",
        provider: "GITHUB",
        retryable: true,
        statusCode: 503,
      };
    }
    if (this.simulateRateLimit) {
      return {
        code: "RATE_LIMITED",
        message: "API rate limit exceeded for GitHub read endpoints (60 req/hr).",
        provider: "GITHUB",
        retryable: true,
        statusCode: 429,
      };
    }
    return null;
  }

  async listRepositories(username: string, options?: RequestOptions): Promise<ProviderResponse<GitHubRepo[]>> {
    const error = this.checkFailureModes("listRepositories");
    const timestamp = new Date().toISOString();

    if (error) {
      return {
        success: false,
        error,
        meta: { provider: "GITHUB", timestamp, sourceUrl: `https://api.github.com/users/${username}/repos` },
      };
    }

    // Conditional request handling (ETag support)
    if (options?.eTag === this.repoETag) {
      return {
        success: true,
        data: [], // 304 Not Modified; cached data can be used
        meta: {
          provider: "GITHUB",
          timestamp,
          requestId: "304-not-modified",
          rateLimitRemaining: 4990,
        },
      };
    }

    const repos: GitHubRepo[] = [
      {
        id: 101,
        fullName: `${username}/wafer-defect-classification`,
        name: "wafer-defect-classification",
        owner: username,
        htmlUrl: `https://github.com/${username}/wafer-defect-classification`,
        description: "Deep learning automated defect detection pipeline for semiconductor wafer inspection using PyTorch.",
        isPrivate: false,
        isFork: false,
        defaultBranch: "main",
        starsCount: 5,
        forksCount: 0,
        openIssuesCount: 2,
        primaryLanguage: "Python",
        topics: ["deep-learning", "pytorch", "computer-vision", "semiconductor"],
        licenseSpdx: "MIT",
        hasContributing: true,
        hasCi: true,
        updatedAt: "2026-10-18T14:30:00Z",
      },
      {
        id: 102,
        fullName: `${username}/confirmtkt-clone`,
        name: "confirmtkt-clone",
        owner: username,
        htmlUrl: `https://github.com/${username}/confirmtkt-clone`,
        description: "Full-stack railway reservation tracking and ticket confirmation predictor in TypeScript and React.",
        isPrivate: false,
        isFork: false,
        defaultBranch: "main",
        starsCount: 0,
        forksCount: 0,
        openIssuesCount: 0,
        primaryLanguage: "TypeScript",
        topics: ["typescript", "react", "nextjs", "tailwind"],
        licenseSpdx: "MIT",
        hasContributing: false,
        hasCi: false,
        updatedAt: "2026-10-10T12:00:00Z",
      },
      {
        id: 103,
        fullName: `${username}/future-agi-experiments`,
        name: "future-agi-experiments",
        owner: username,
        htmlUrl: `https://github.com/${username}/future-agi-experiments`,
        description: "Exploration repository for agentic workflows and local LLM evaluation harnesses.",
        isPrivate: false,
        isFork: false,
        defaultBranch: "main",
        starsCount: 2,
        forksCount: 0,
        openIssuesCount: 1,
        primaryLanguage: "Python",
        topics: ["agents", "llm", "rag", "evaluations"],
        licenseSpdx: "Apache-2.0",
        hasContributing: true,
        hasCi: true,
        updatedAt: "2026-10-19T08:15:00Z",
      },
      {
        id: 104,
        fullName: `${username}/open-source-starter-lab`,
        name: "open-source-starter-lab",
        owner: username,
        htmlUrl: `https://github.com/${username}/open-source-starter-lab`,
        description: "Forked contribution practice sandbox for open-source workflows.",
        isPrivate: false,
        isFork: true, // Fork
        defaultBranch: "main",
        starsCount: 1,
        forksCount: 0,
        openIssuesCount: 0,
        primaryLanguage: "TypeScript",
        topics: ["open-source", "first-contributions"],
        licenseSpdx: "MIT",
        hasContributing: true,
        hasCi: true,
        updatedAt: "2026-10-05T09:00:00Z",
      },
    ];

    return {
      success: true,
      data: repos,
      meta: {
        provider: "GITHUB",
        timestamp,
        rateLimitRemaining: 4950,
        rateLimitReset: "1729555200",
        sourceUrl: `https://api.github.com/users/${username}/repos`,
      },
    };
  }

  async listStarredRepositories(username: string, options?: RequestOptions): Promise<ProviderResponse<GitHubRepo[]>> {
    const error = this.checkFailureModes("listStarredRepositories");
    const timestamp = new Date().toISOString();

    if (error) {
      return { success: false, error, meta: { provider: "GITHUB", timestamp } };
    }

    const starred: GitHubRepo[] = [
      {
        id: 201,
        fullName: "redis/redis",
        name: "redis",
        owner: "redis",
        htmlUrl: "https://github.com/redis/redis",
        description: "In-memory database that persists on disk. The data model is key-value.",
        isPrivate: false,
        isFork: false,
        defaultBranch: "unstable",
        starsCount: 64500,
        forksCount: 23200,
        openIssuesCount: 320,
        primaryLanguage: "C",
        topics: ["database", "in-memory", "redis", "key-value"],
        licenseSpdx: "BSD-3-Clause",
        hasContributing: true,
        hasCi: true,
        updatedAt: "2026-10-21T18:00:00Z",
      },
      {
        id: 202,
        fullName: "pytorch/pytorch",
        name: "pytorch",
        owner: "pytorch",
        htmlUrl: "https://github.com/pytorch/pytorch",
        description: "Tensors and Dynamic neural networks in Python with strong GPU acceleration.",
        isPrivate: false,
        isFork: false,
        defaultBranch: "main",
        starsCount: 82300,
        forksCount: 21900,
        openIssuesCount: 4200,
        primaryLanguage: "Python",
        topics: ["pytorch", "machine-learning", "deep-learning", "tensors"],
        licenseSpdx: "BSD-3-Clause",
        hasContributing: true,
        hasCi: true,
        updatedAt: "2026-10-21T19:00:00Z",
      },
    ];

    return {
      success: true,
      data: starred,
      meta: { provider: "GITHUB", timestamp, rateLimitRemaining: 4930 },
    };
  }

  async listIssues(repo: string, options?: RequestOptions): Promise<ProviderResponse<GitHubIssue[]>> {
    const error = this.checkFailureModes("listIssues");
    const timestamp = new Date().toISOString();

    if (error) {
      return { success: false, error, meta: { provider: "GITHUB", timestamp } };
    }

    const issues: GitHubIssue[] = [
      {
        id: 301,
        number: 3,
        title: "Add batch inference benchmark and latency profiling",
        htmlUrl: `https://github.com/${repo}/issues/3`,
        state: "open",
        body: `### Description
We need reproducible latency profiling and batch throughput benchmarks for wafer defect classification models under production load.

### Acceptance Criteria
- Add \`benchmarks/inference_profile.py\`
- Measure avg latency per wafer (target < 15ms)
- Output p95 and p99 percentiles
- Automated unit test verifying benchmark reproducibility via pytest`,
        labels: ["enhancement", "good first issue"],
        isAssigned: false,
        createdAt: "2026-10-15T10:00:00Z",
        updatedAt: "2026-10-20T12:00:00Z",
      },
      {
        id: 302,
        number: 4,
        title: "Support ONNX runtime export for edge wafer inspection",
        htmlUrl: `https://github.com/${repo}/issues/4`,
        state: "open",
        body: `Support exporting trained PyTorch wafer models to ONNX format for deployment on industrial edge sensors.
Include dynamic batch axis and validation test comparing PyTorch vs ONNX outputs.`,
        labels: ["feature", "help wanted"],
        isAssigned: false,
        createdAt: "2026-10-16T14:00:00Z",
        updatedAt: "2026-10-21T09:30:00Z",
      },
    ];

    return {
      success: true,
      data: issues,
      meta: { provider: "GITHUB", timestamp, rateLimitRemaining: 4920 },
    };
  }

  async getIssue(repo: string, issueNumber: number): Promise<ProviderResponse<GitHubIssue>> {
    const error = this.checkFailureModes("getIssue");
    const timestamp = new Date().toISOString();

    if (error) {
      return { success: false, error, meta: { provider: "GITHUB", timestamp } };
    }

    return {
      success: true,
      data: {
        id: 301,
        number: issueNumber,
        title: "Add batch inference benchmark and latency profiling",
        htmlUrl: `https://github.com/${repo}/issues/${issueNumber}`,
        state: "open",
        body: "Profile memory usage and per-wafer inference time under high throughput.",
        labels: ["enhancement", "good first issue"],
        isAssigned: false,
        createdAt: "2026-10-15T10:00:00Z",
        updatedAt: "2026-10-20T12:00:00Z",
      },
      meta: { provider: "GITHUB", timestamp },
    };
  }

  async listUserPullRequests(username: string): Promise<ProviderResponse<GitHubPR[]>> {
    const error = this.checkFailureModes("listUserPullRequests");
    const timestamp = new Date().toISOString();

    if (error) {
      return { success: false, error, meta: { provider: "GITHUB", timestamp } };
    }

    const prs: GitHubPR[] = [
      {
        id: 401,
        number: 1,
        htmlUrl: `https://github.com/${username}/wafer-defect-classification/pull/1`,
        title: "feat: add resnet50 backbone and mixed precision training",
        baseRef: "main",
        headRef: "feat/resnet-mixed-precision",
        state: "merged",
        isDraft: false,
        createdAt: "2026-09-12T10:00:00Z",
        updatedAt: "2026-09-15T14:00:00Z",
      },
      {
        id: 402,
        number: 2,
        htmlUrl: `https://github.com/${username}/wafer-defect-classification/pull/2`,
        title: "docs: add model architecture and benchmark evaluation instructions",
        baseRef: "main",
        headRef: "docs/architecture-guide",
        state: "merged",
        isDraft: false,
        createdAt: "2026-09-20T16:00:00Z",
        updatedAt: "2026-09-22T11:00:00Z",
      },
    ];

    return {
      success: true,
      data: prs,
      meta: { provider: "GITHUB", timestamp, rateLimitRemaining: 4910 },
    };
  }

  async getPullRequest(repo: string, prNumber: number): Promise<ProviderResponse<GitHubPR>> {
    const error = this.checkFailureModes("getPullRequest");
    const timestamp = new Date().toISOString();

    if (error) {
      return { success: false, error, meta: { provider: "GITHUB", timestamp } };
    }

    return {
      success: true,
      data: {
        id: 401,
        number: prNumber,
        htmlUrl: `https://github.com/${repo}/pull/${prNumber}`,
        title: "feat: add batch inference benchmark",
        baseRef: "main",
        headRef: "feat/batch-inference-benchmark",
        state: "open",
        isDraft: false,
        createdAt: "2026-10-21T18:00:00Z",
        updatedAt: "2026-10-21T18:00:00Z",
      },
      meta: { provider: "GITHUB", timestamp },
    };
  }

  async getTrendingRepositories(
    language: string = "python",
    timeframe: "daily" | "weekly" | "monthly" = "daily"
  ): Promise<ProviderResponse<TrendingRepo[]>> {
    const error = this.checkFailureModes("getTrendingRepositories");
    const timestamp = new Date().toISOString();

    if (error) {
      return { success: false, error, meta: { provider: "GITHUB", timestamp } };
    }

    const trending: TrendingRepo[] = [
      {
        fullName: "vllm-project/vllm",
        htmlUrl: "https://github.com/vllm-project/vllm",
        description: "A high-throughput and memory-efficient inference and serving engine for LLMs.",
        language: "Python",
        starsToday: 320,
        totalStars: 34100,
        forks: 4800,
        timeframe,
        matchReason: "Matches your deep learning systems interest (Python, PyTorch, GPU inference).",
      },
      {
        fullName: "uber-go/zap",
        htmlUrl: "https://github.com/uber-go/zap",
        description: "Blazing fast, structured, leveled logging in Go.",
        language: "Go",
        starsToday: 85,
        totalStars: 21900,
        forks: 1400,
        timeframe,
        matchReason: "Matches backend systems & logging infrastructure requirements.",
      },
      {
        fullName: "trpc/trpc",
        htmlUrl: "https://github.com/trpc/trpc",
        description: "Move Fast and Break Nothing. End-to-end typesafe APIs made easy.",
        language: "TypeScript",
        starsToday: 110,
        totalStars: 36200,
        forks: 1200,
        timeframe,
        matchReason: "Matches full-stack TypeScript and Next.js developer tools expertise.",
      },
    ];

    const filtered = trending.filter(
      (t) => !language || language.toLowerCase() === "all" || t.language.toLowerCase() === language.toLowerCase()
    );

    return {
      success: true,
      data: filtered,
      meta: {
        provider: "GITHUB",
        timestamp,
        sourceUrl: `https://github.com/trending/${language}?since=${timeframe}`,
      },
    };
  }

  async openPullRequest(input: OpenPRInput): Promise<ProviderResponse<GitHubPR>> {
    const error = this.checkFailureModes("openPullRequest");
    const timestamp = new Date().toISOString();

    if (error) {
      return { success: false, error, meta: { provider: "GITHUB", timestamp } };
    }

    if (!this.writeCapabilityGranted) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Write operation blocked: GitHub write capability is not enabled. Read-only mode active.",
          provider: "GITHUB",
          retryable: false,
          statusCode: 403,
        },
        meta: { provider: "GITHUB", timestamp },
      };
    }

    if (!input.approvalToken || !input.approvalToken.isApproved) {
      return {
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Remote PR creation blocked: Action requires immediate user approval.",
          provider: "GITHUB",
          retryable: false,
          statusCode: 403,
        },
        meta: { provider: "GITHUB", timestamp },
      };
    }

    if (input.approvalToken.contentHash !== input.diffHash) {
      return {
        success: false,
        error: {
          code: "APPROVAL_MISMATCH",
          message: "Diff hash mismatch: Patch code changed after user approval was issued.",
          provider: "GITHUB",
          retryable: false,
          statusCode: 409,
        },
        meta: { provider: "GITHUB", timestamp },
      };
    }

    return {
      success: true,
      data: {
        id: 501,
        number: 4,
        htmlUrl: `https://github.com/${input.repo}/pull/4`,
        title: input.title,
        baseRef: input.baseRef,
        headRef: input.headRef,
        state: "open",
        isDraft: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      meta: { provider: "GITHUB", timestamp, sourceUrl: `https://github.com/${input.repo}/pull/4` },
    };
  }
}
