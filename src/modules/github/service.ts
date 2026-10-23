import { MockGitHubAdapter, GitHubRepo, GitHubIssue, GitHubPR, TrendingRepo } from "@/integrations/github";
import { GitHubRepositoryItem, ScoredIssueCandidate, RepositoryFilterOptions } from "./types";
import { evaluateIssueRubric } from "./rubric";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export class GitHubLabService {
  private adapter: MockGitHubAdapter;
  private repoCache: Map<string, { data: GitHubRepositoryItem[]; timestamp: number }> = new Map();
  private issueCache: Map<string, { data: ScoredIssueCandidate[]; timestamp: number }> = new Map();

  constructor(adapter?: MockGitHubAdapter) {
    this.adapter = adapter || new MockGitHubAdapter();
  }

  /**
   * Fetches and categorizes owned repositories, forks, and starred repositories with filtering.
   */
  async getCategorizedRepositories(
    username: string,
    filters?: RepositoryFilterOptions
  ): Promise<GitHubRepositoryItem[]> {
    // Check in-memory cache (5-minute TTL)
    const cacheKey = `repos-${username}`;
    const cached = this.repoCache.get(cacheKey);
    let items: GitHubRepositoryItem[] = [];

    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      items = cached.data;
    } else {
      const [userReposRes, starredReposRes] = await Promise.all([
        this.adapter.listRepositories(username),
        this.adapter.listStarredRepositories(username),
      ]);

      if (userReposRes.data) {
        for (const repo of userReposRes.data) {
          items.push({
            id: String(repo.id),
            fullName: repo.fullName,
            name: repo.name,
            owner: repo.owner,
            htmlUrl: repo.htmlUrl,
            description: repo.description,
            category: repo.isFork ? "FORK" : "OWNED",
            isFork: repo.isFork,
            isPrivate: repo.isPrivate,
            starsCount: repo.starsCount,
            forksCount: repo.forksCount,
            openIssuesCount: repo.openIssuesCount,
            primaryLanguage: repo.primaryLanguage || "Unknown",
            topics: repo.topics,
            licenseSpdx: repo.licenseSpdx || "None",
            hasContributing: repo.hasContributing,
            hasCodeOfConduct: true,
            hasCi: repo.hasCi,
            lastPushedAt: repo.updatedAt,
            updatedAt: repo.updatedAt,
            relevanceReason: repo.isFork ? "Forked practice repository" : "Primary verified project",
          });
        }
      }

      if (starredReposRes.data) {
        for (const repo of starredReposRes.data) {
          items.push({
            id: String(repo.id),
            fullName: repo.fullName,
            name: repo.name,
            owner: repo.owner,
            htmlUrl: repo.htmlUrl,
            description: repo.description,
            category: "STARRED",
            isFork: false,
            isPrivate: false,
            starsCount: repo.starsCount,
            forksCount: repo.forksCount,
            openIssuesCount: repo.openIssuesCount,
            primaryLanguage: repo.primaryLanguage || "Unknown",
            topics: repo.topics,
            licenseSpdx: repo.licenseSpdx || "None",
            hasContributing: repo.hasContributing,
            hasCodeOfConduct: true,
            hasCi: repo.hasCi,
            lastPushedAt: repo.updatedAt,
            updatedAt: repo.updatedAt,
            relevanceReason: "High-value upstream repository",
          });
        }
      }

      this.repoCache.set(cacheKey, { data: items, timestamp: Date.now() });
    }

    // Apply Filters
    return items.filter((item) => {
      if (filters?.category && item.category !== filters.category) return false;
      if (filters?.isFork !== undefined && item.isFork !== filters.isFork) return false;
      if (filters?.language && filters.language !== "ALL" && item.primaryLanguage.toLowerCase() !== filters.language.toLowerCase()) {
        return false;
      }
      if (filters?.minStars && item.starsCount < filters.minStars) return false;
      if (filters?.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = item.fullName.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }

  /**
   * Discovers and scores open issues from watched repositories using the explainable rubric.
   */
  async discoverAndScoreIssues(
    repoFullName: string,
    verifiedSkills: string[] = ["Python", "PyTorch", "TypeScript", "SQL"]
  ): Promise<ScoredIssueCandidate[]> {
    const cacheKey = `issues-${repoFullName}`;
    const cached = this.issueCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data;
    }

    const issuesRes = await this.adapter.listIssues(repoFullName);
    if (!issuesRes.success || !issuesRes.data) {
      return [];
    }

    const scoredCandidates: ScoredIssueCandidate[] = [];

    for (const issue of issuesRes.data) {
      const rubric = evaluateIssueRubric({
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
        isOpen: issue.state === "open",
        isAssigned: issue.isAssigned,
        repoLanguage: "Python",
        hasContributing: true,
        hasLicense: true,
        hasCi: true,
        updatedAt: issue.updatedAt,
        verifiedSkills,
      });

      scoredCandidates.push({
        id: `issue-${issue.id}`,
        repoFullName,
        repoUrl: `https://github.com/${repoFullName}`,
        issueNumber: issue.number,
        issueUrl: issue.htmlUrl,
        title: issue.title,
        bodySummary: issue.body.length > 180 ? `${issue.body.substring(0, 180)}...` : issue.body,
        labels: issue.labels,
        isOpen: issue.state === "open",
        isAssigned: issue.isAssigned,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        rubric,
        complexity: rubric.testabilityScore > 14 ? "LOW" : "MEDIUM",
        recommendedNextStep: "Clone into isolated sandbox and run existing test suite before planning patch.",
      });
    }

    // Sort descending by totalScore
    scoredCandidates.sort((a, b) => b.rubric.totalScore - a.rubric.totalScore);

    this.issueCache.set(cacheKey, { data: scoredCandidates, timestamp: Date.now() });
    return scoredCandidates;
  }

  /**
   * Fetches trending repositories configurable by language and timeframe.
   */
  async getTrending(
    language: string = "python",
    timeframe: "daily" | "weekly" | "monthly" = "daily"
  ): Promise<TrendingRepo[]> {
    const res = await this.adapter.getTrendingRepositories(language, timeframe);
    return res.data || [];
  }

  /**
   * Fetches pull requests and contribution history.
   */
  async getPullRequests(username: string): Promise<GitHubPR[]> {
    const res = await this.adapter.listUserPullRequests(username);
    return res.data || [];
  }

  /**
   * Promotes an issue candidate to the Contribution Workbench.
   */
  async promoteToWorkbench(userId: string, issueCandidate: ScoredIssueCandidate): Promise<void> {
    logger.info("GITHUB_LAB", `Promoting issue #${issueCandidate.issueNumber} to contribution workbench`, {
      repo: issueCandidate.repoFullName,
      issueNumber: issueCandidate.issueNumber,
      suitabilityScore: issueCandidate.rubric.totalScore,
    });

    // Ensure watch record exists
    let repoWatch = await prisma.repositoryWatch.findUnique({
      where: { repoFullName: issueCandidate.repoFullName },
    });

    if (!repoWatch) {
      repoWatch = await prisma.repositoryWatch.create({
        data: {
          userId,
          repoFullName: issueCandidate.repoFullName,
          repoUrl: issueCandidate.repoUrl,
          isOwned: true,
          primaryLanguage: "Python",
          licenseSpdx: "MIT",
          hasContributing: true,
        },
      });
    }

    // Upsert IssueCandidate
    const savedIssue = await prisma.issueCandidate.upsert({
      where: { issueUrl: issueCandidate.issueUrl },
      update: {
        suitabilityScore: issueCandidate.rubric.totalScore,
        scoreRationale: issueCandidate.rubric.rationale,
        status: "ACCEPTED",
      },
      create: {
        repoWatchId: repoWatch.id,
        issueNumber: issueCandidate.issueNumber,
        issueUrl: issueCandidate.issueUrl,
        title: issueCandidate.title,
        bodySummary: issueCandidate.bodySummary,
        labels: issueCandidate.labels,
        suitabilityScore: issueCandidate.rubric.totalScore,
        scoreRationale: issueCandidate.rubric.rationale,
        complexityEstimate: issueCandidate.complexity,
        status: "ACCEPTED",
      },
    });

    // Register contribution task in PLANNED state
    await prisma.contributionTask.create({
      data: {
        userId,
        repoWatchId: repoWatch.id,
        issueCandidateId: savedIssue.id,
        branchName: `fix/issue-${issueCandidate.issueNumber}`,
        contributionPlan: "1. Inspect reproduction steps\n2. Set up isolated sandbox\n3. Implement fix and tests",
        status: "PLANNED",
      },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        userId,
        actorType: "USER",
        moduleName: "GITHUB_LAB",
        actionName: "ISSUE_PROMOTED_TO_WORKBENCH",
        targetResource: `${issueCandidate.repoFullName}#${issueCandidate.issueNumber}`,
        status: "SUCCESS",
        detailsRedacted: JSON.stringify({
          score: issueCandidate.rubric.totalScore,
          uncertainty: issueCandidate.rubric.uncertainty,
        }),
      },
    });
  }
}
