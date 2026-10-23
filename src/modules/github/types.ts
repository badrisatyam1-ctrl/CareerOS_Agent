/**
 * GitHub Lab Domain Types
 */

export type RepoCategory = "OWNED" | "FORK" | "STARRED" | "WATCHED" | "TRENDING";

export interface GitHubRepositoryItem {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  htmlUrl: string;
  description: string | null;
  category: RepoCategory;
  isFork: boolean;
  isPrivate: boolean;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  primaryLanguage: string;
  topics: string[];
  licenseSpdx: string;
  hasContributing: boolean;
  hasCodeOfConduct: boolean;
  hasCi: boolean;
  lastPushedAt: string;
  updatedAt: string;
  relevanceReason?: string;
}

export interface IssueRubricBreakdown {
  skillMatchScore: number;       // 0-25: match to Python, PyTorch, TypeScript, Go, C++, Systems
  clarityScore: number;          // 0-20: clear reproduction steps, acceptance criteria
  testabilityScore: number;      // 0-20: unit test suite exists, reproducible locally
  maintainerScore: number;       // 0-15: responsive reviews, timely PR merges, active maintainers
  repoHealthScore: number;       // 0-10: license, CONTRIBUTING.md, active CI
  freshnessScore: number;        // 0-10: updated within last 14-30 days
  totalScore: number;            // 0-100 overall suitability
  uncertainty: "LOW" | "MEDIUM" | "HIGH";
  rationale: string;
  warnings: string[];
}

export interface ScoredIssueCandidate {
  id: string;
  repoFullName: string;
  repoUrl: string;
  issueNumber: number;
  issueUrl: string;
  title: string;
  bodySummary: string;
  labels: string[];
  isOpen: boolean;
  isAssigned: boolean;
  createdAt: string;
  updatedAt: string;
  rubric: IssueRubricBreakdown;
  complexity: "LOW" | "MEDIUM" | "HIGH";
  recommendedNextStep: string;
}

export interface TrendingRepositoryItem {
  repoFullName: string;
  htmlUrl: string;
  description: string;
  language: string;
  starsToday: number;
  totalStars: number;
  forks: number;
  timeframe: "daily" | "weekly" | "monthly";
  matchReason: string;
}

export interface UserPullRequestItem {
  id: number;
  number: number;
  title: string;
  htmlUrl: string;
  repoFullName: string;
  state: "open" | "closed" | "merged";
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  reviewsState?: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
}

export interface RepositoryFilterOptions {
  language?: string;
  topic?: string;
  category?: RepoCategory;
  isFork?: boolean;
  minStars?: number;
  license?: string;
  searchQuery?: string;
}
