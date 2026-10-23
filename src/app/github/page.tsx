"use client";

import { useState, useEffect } from "react";
import {
  GitBranch,
  Star,
  GitFork,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Flame,
  FileCode2,
  GitPullRequest,
  HelpCircle,
  Tag,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { GitHubRepositoryItem, ScoredIssueCandidate, TrendingRepositoryItem } from "@/modules/github/types";
import LiveTrackerWidget from "@/components/LiveTrackerWidget";

const INITIAL_REPOSITORIES: GitHubRepositoryItem[] = [
  {
    id: "101",
    fullName: "badrisatyam1-ctrl/wafer-defect-classification",
    name: "wafer-defect-classification",
    owner: "badrisatyam1-ctrl",
    htmlUrl: "https://github.com/badrisatyam1-ctrl/wafer-defect-classification",
    description: "Deep learning automated defect detection pipeline for semiconductor wafer inspection using PyTorch.",
    category: "OWNED",
    isFork: false,
    isPrivate: false,
    starsCount: 5,
    forksCount: 0,
    openIssuesCount: 2,
    primaryLanguage: "Python",
    topics: ["deep-learning", "pytorch", "computer-vision", "semiconductor"],
    licenseSpdx: "MIT",
    hasContributing: true,
    hasCodeOfConduct: true,
    hasCi: true,
    lastPushedAt: "2026-10-18T14:30:00Z",
    updatedAt: "2026-10-18T14:30:00Z",
    relevanceReason: "Primary owned verified project (5 stars)",
  },
  {
    id: "102",
    fullName: "badrisatyam1-ctrl/confirmtkt-clone",
    name: "confirmtkt-clone",
    owner: "badrisatyam1-ctrl",
    htmlUrl: "https://github.com/badrisatyam1-ctrl/confirmtkt-clone",
    description: "Full-stack railway reservation tracking and ticket confirmation predictor in TypeScript and React.",
    category: "OWNED",
    isFork: false,
    isPrivate: false,
    starsCount: 0,
    forksCount: 0,
    openIssuesCount: 0,
    primaryLanguage: "TypeScript",
    topics: ["typescript", "react", "nextjs", "tailwind"],
    licenseSpdx: "MIT",
    hasContributing: false,
    hasCodeOfConduct: false,
    hasCi: false,
    lastPushedAt: "2026-10-10T12:00:00Z",
    updatedAt: "2026-10-10T12:00:00Z",
    relevanceReason: "Full-stack web application",
  },
  {
    id: "103",
    fullName: "badrisatyam1-ctrl/open-source-starter-lab",
    name: "open-source-starter-lab",
    owner: "badrisatyam1-ctrl",
    htmlUrl: "https://github.com/badrisatyam1-ctrl/open-source-starter-lab",
    description: "Forked contribution practice sandbox for open-source workflows.",
    category: "FORK",
    isFork: true,
    isPrivate: false,
    starsCount: 1,
    forksCount: 0,
    openIssuesCount: 0,
    primaryLanguage: "TypeScript",
    topics: ["open-source", "first-contributions"],
    licenseSpdx: "MIT",
    hasContributing: true,
    hasCodeOfConduct: true,
    hasCi: true,
    lastPushedAt: "2026-10-05T09:00:00Z",
    updatedAt: "2026-10-05T09:00:00Z",
    relevanceReason: "Forked practice repository",
  },
  {
    id: "201",
    fullName: "redis/redis",
    name: "redis",
    owner: "redis",
    htmlUrl: "https://github.com/redis/redis",
    description: "In-memory database that persists on disk. The data model is key-value.",
    category: "STARRED",
    isFork: false,
    isPrivate: false,
    starsCount: 64500,
    forksCount: 23200,
    openIssuesCount: 320,
    primaryLanguage: "C",
    topics: ["database", "in-memory", "redis", "key-value"],
    licenseSpdx: "BSD-3-Clause",
    hasContributing: true,
    hasCodeOfConduct: true,
    hasCi: true,
    lastPushedAt: "2026-10-21T18:00:00Z",
    updatedAt: "2026-10-21T18:00:00Z",
    relevanceReason: "Starred upstream systems project",
  },
  {
    id: "202",
    fullName: "pytorch/pytorch",
    name: "pytorch",
    owner: "pytorch",
    htmlUrl: "https://github.com/pytorch/pytorch",
    description: "Tensors and Dynamic neural networks in Python with strong GPU acceleration.",
    category: "STARRED",
    isFork: false,
    isPrivate: false,
    starsCount: 82300,
    forksCount: 21900,
    openIssuesCount: 4200,
    primaryLanguage: "Python",
    topics: ["pytorch", "machine-learning", "deep-learning", "tensors"],
    licenseSpdx: "BSD-3-Clause",
    hasContributing: true,
    hasCodeOfConduct: true,
    hasCi: true,
    lastPushedAt: "2026-10-21T19:00:00Z",
    updatedAt: "2026-10-21T19:00:00Z",
    relevanceReason: "Starred upstream ML framework",
  },
];

const INITIAL_ISSUES: ScoredIssueCandidate[] = [
  {
    id: "issue-301",
    repoFullName: "badrisatyam1-ctrl/wafer-defect-classification",
    repoUrl: "https://github.com/badrisatyam1-ctrl/wafer-defect-classification",
    issueNumber: 3,
    issueUrl: "https://github.com/badrisatyam1-ctrl/wafer-defect-classification/issues/3",
    title: "Add batch inference benchmark and latency profiling",
    bodySummary: "Profile memory usage and per-wafer inference time under high throughput. Add benchmark script with p95/p99 percentiles.",
    labels: ["enhancement", "good first issue"],
    isOpen: true,
    isAssigned: false,
    createdAt: "2026-10-15T10:00:00Z",
    updatedAt: "2026-10-20T12:00:00Z",
    rubric: {
      skillMatchScore: 25,
      clarityScore: 20,
      testabilityScore: 18,
      maintainerScore: 15,
      repoHealthScore: 10,
      freshnessScore: 8,
      totalScore: 96,
      uncertainty: "LOW",
      rationale: "Strong overlap with confirmed Python/PyTorch skills, actionable description with testable acceptance criteria.",
      warnings: [],
    },
    complexity: "LOW",
    recommendedNextStep: "Clone into isolated sandbox and run existing test suite before planning patch.",
  },
  {
    id: "issue-302",
    repoFullName: "badrisatyam1-ctrl/wafer-defect-classification",
    repoUrl: "https://github.com/badrisatyam1-ctrl/wafer-defect-classification",
    issueNumber: 4,
    issueUrl: "https://github.com/badrisatyam1-ctrl/wafer-defect-classification/issues/4",
    title: "Support ONNX runtime export for edge wafer inspection",
    bodySummary: "Support exporting trained PyTorch models to ONNX format with dynamic batch axes for edge sensor deployment.",
    labels: ["feature", "help wanted"],
    isOpen: true,
    isAssigned: false,
    createdAt: "2026-10-16T14:00:00Z",
    updatedAt: "2026-10-21T09:30:00Z",
    rubric: {
      skillMatchScore: 23,
      clarityScore: 16,
      testabilityScore: 15,
      maintainerScore: 14,
      repoHealthScore: 10,
      freshnessScore: 10,
      totalScore: 88,
      uncertainty: "MEDIUM",
      rationale: "Direct match for edge ML deployment goals. Requires validation script comparing PyTorch vs ONNX output parity.",
      warnings: [],
    },
    complexity: "MEDIUM",
    recommendedNextStep: "Draft ONNX export test in sandbox and verify runtime latency.",
  },
];

const INITIAL_TRENDING: TrendingRepositoryItem[] = [
  {
    repoFullName: "vllm-project/vllm",
    htmlUrl: "https://github.com/vllm-project/vllm",
    description: "A high-throughput and memory-efficient inference and serving engine for LLMs.",
    language: "Python",
    starsToday: 320,
    totalStars: 34100,
    forks: 4800,
    timeframe: "daily",
    matchReason: "Matches deep learning systems profile (Python, PyTorch, GPU inference optimization).",
  },
  {
    repoFullName: "uber-go/zap",
    htmlUrl: "https://github.com/uber-go/zap",
    description: "Blazing fast, structured, leveled logging in Go.",
    language: "Go",
    starsToday: 85,
    totalStars: 21900,
    forks: 1400,
    timeframe: "daily",
    matchReason: "Matches backend systems & telemetry logging infrastructure requirements.",
  },
  {
    repoFullName: "trpc/trpc",
    htmlUrl: "https://github.com/trpc/trpc",
    description: "Move Fast and Break Nothing. End-to-end typesafe APIs made easy.",
    language: "TypeScript",
    starsToday: 110,
    totalStars: 36200,
    forks: 1200,
    timeframe: "daily",
    matchReason: "Matches full-stack TypeScript and Next.js developer tools expertise.",
  },
];

export default function GitHubLabPage() {
  const [activeTab, setActiveTab] = useState<"repos" | "issues" | "trending" | "prs">("repos");
  const [languageFilter, setLanguageFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [trendingLang, setTrendingLang] = useState<string>("Python");
  const [selectedIssue, setSelectedIssue] = useState<ScoredIssueCandidate | null>(INITIAL_ISSUES[0]);
  const [promotedIssues, setPromotedIssues] = useState<Record<string, boolean>>({});

  const [repositories, setRepositories] = useState<GitHubRepositoryItem[]>(INITIAL_REPOSITORIES);
  const [isRealConnected, setIsRealConnected] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<string>("DEMO");
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number>(4950);
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(false);

  useEffect(() => {
    setIsLoadingRepos(true);
    fetch("/api/github/repositories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped: GitHubRepositoryItem[] = data.data.map((r: any) => ({
            id: String(r.id),
            fullName: r.fullName,
            name: r.name,
            owner: r.owner,
            htmlUrl: r.htmlUrl,
            description: r.description,
            category: r.isFork ? ("FORK" as const) : ("OWNED" as const),
            isFork: r.isFork,
            isPrivate: r.isPrivate,
            starsCount: r.starsCount,
            forksCount: r.forksCount,
            openIssuesCount: r.openIssuesCount,
            primaryLanguage: r.primaryLanguage || "Other",
            topics: r.topics || [],
            licenseSpdx: r.licenseSpdx || "None",
            hasContributing: r.hasContributing || false,
            hasCodeOfConduct: r.hasCodeOfConduct || false,
            hasCi: r.hasCi || false,
            lastPushedAt: r.updatedAt,
            updatedAt: r.updatedAt,
            relevanceReason: r.isFork
              ? "Forked open-source ecosystem project"
              : `Primary owned repository (${r.starsCount} stars)`,
          }));
          setRepositories(mapped);
          setIsRealConnected(data.isReal);
          setCurrentMode(data.mode);
          if (data.meta?.rateLimitRemaining !== undefined) {
            setRateLimitRemaining(data.meta.rateLimitRemaining);
          }
        }
      })
      .catch((err) => console.error("Failed to load GitHub repositories:", err))
      .finally(() => setIsLoadingRepos(false));
  }, []);

  const handlePromote = (issueId: string) => {
    setPromotedIssues((prev) => ({ ...prev, [issueId]: true }));
  };

  const filteredRepos = repositories.filter((repo) => {
    if (categoryFilter !== "ALL" && repo.category !== categoryFilter) return false;
    if (languageFilter !== "ALL" && repo.primaryLanguage !== languageFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = repo.fullName.toLowerCase().includes(q);
      const matchDesc = repo.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const filteredTrending = INITIAL_TRENDING.filter(
    (t) => trendingLang === "ALL" || t.language.toLowerCase() === trendingLang.toLowerCase()
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-teal-600" />
            GitHub Intelligence Lab
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Read-only discovery of owned, forked, and trending repositories. Evaluates issues via explainable suitability rubrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-mono text-slate-700 border border-slate-200 font-medium">
            Rate Limit: {rateLimitRemaining.toLocaleString()} remaining
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono border font-semibold ${
              isRealConnected
                ? "bg-teal-50 text-teal-700 border-teal-200"
                : "bg-purple-50 text-purple-700 border-purple-200"
            }`}
          >
            {isRealConnected ? `● ${currentMode}` : "🧪 DEMO MODE"}
          </span>
        </div>
      </div>

      {/* Real-time GitHub & LeetCode telemetry */}
      <LiveTrackerWidget />

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("repos")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "repos"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          My Repos & Forks ({INITIAL_REPOSITORIES.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("issues")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === "issues"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Issue Candidates Radar ({INITIAL_ISSUES.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("trending")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === "trending"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>GitHub Trending</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("prs")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === "prs"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>Pull Requests & History</span>
        </button>
      </div>

      {/* TAB 1: Repositories & Forks */}
      {activeTab === "repos" && (
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="omni-card border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 font-medium"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-teal-600 font-medium"
              >
                <option value="ALL">All Categories</option>
                <option value="OWNED">Owned Only</option>
                <option value="FORK">Forks Only</option>
                <option value="STARRED">Starred Only</option>
              </select>

              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-teal-600 font-medium"
              >
                <option value="ALL">All Languages</option>
                <option value="Python">Python</option>
                <option value="TypeScript">TypeScript</option>
                <option value="C">C / C++</option>
              </select>
            </div>
          </div>

          {/* Repositories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRepos.map((repo) => (
              <div
                key={repo.id}
                className="omni-card border border-slate-200 rounded-2xl p-5 hover:border-teal-400 hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        repo.category === "OWNED"
                          ? "bg-teal-50 text-teal-800 border border-teal-200"
                          : repo.category === "FORK"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {repo.category}
                    </span>
                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-teal-700 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2 font-mono truncate">{repo.fullName}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {repo.description || "No description provided."}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {repo.topics.slice(0, 3).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 border border-slate-200">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    <span className="font-medium text-slate-700">{repo.primaryLanguage}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-700">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {repo.starsCount}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{repo.licenseSpdx}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Issue Candidates Radar */}
      {activeTab === "issues" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issue Candidates List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {INITIAL_ISSUES.map((issue) => (
              <div
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className={`omni-card border rounded-2xl p-6 cursor-pointer transition space-y-4 shadow-sm ${
                  selectedIssue?.id === issue.id
                    ? "border-teal-500 ring-2 ring-teal-500/20 shadow-md"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-teal-700">#{issue.issueNumber}</span>
                      <span className="text-xs font-mono text-slate-500">{issue.repoFullName}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{issue.title}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-2xl font-black text-teal-700">{issue.rubric.totalScore}%</span>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Suitability</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{issue.bodySummary}</p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {issue.labels.map((l) => (
                      <span key={l} className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {l}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                      Uncertainty: {issue.rubric.uncertainty}
                    </span>
                  </div>

                  {promotedIssues[issue.id] ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-teal-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accepted</span>
                      </span>
                      <Link
                        href={`/contributions?issue=${issue.id}`}
                        className="px-3 py-1.5 rounded-lg omni-btn-primary text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                      >
                        <span>Open Workbench</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePromote(issue.id);
                      }}
                      className="px-3.5 py-1.5 rounded-lg omni-btn-primary text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                    >
                      <span>Accept for Workbench</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Rubric Breakdown Inspector (1 col) */}
          <div className="space-y-5">
            {selectedIssue ? (
              <div className="omni-card border border-slate-200 rounded-2xl p-6 space-y-5 sticky top-20 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900">Explainable Scoring Rubric</h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {selectedIssue.rubric.totalScore}/100
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-700 mb-1 font-medium">
                      <span>Confirmed Skill Overlap:</span>
                      <span className="font-mono font-bold text-teal-700">{selectedIssue.rubric.skillMatchScore}/25</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full" style={{ width: `${(selectedIssue.rubric.skillMatchScore / 25) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 mb-1 font-medium">
                      <span>Issue Clarity & Acceptance Criteria:</span>
                      <span className="font-mono font-bold text-teal-700">{selectedIssue.rubric.clarityScore}/20</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full" style={{ width: `${(selectedIssue.rubric.clarityScore / 20) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 mb-1 font-medium">
                      <span>Testability & Local Verification:</span>
                      <span className="font-mono font-bold text-teal-700">{selectedIssue.rubric.testabilityScore}/20</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full" style={{ width: `${(selectedIssue.rubric.testabilityScore / 20) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 mb-1 font-medium">
                      <span>Maintainer Signals & Welcoming PRs:</span>
                      <span className="font-mono font-bold text-teal-700">{selectedIssue.rubric.maintainerScore}/15</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-teal-600 h-full rounded-full" style={{ width: `${(selectedIssue.rubric.maintainerScore / 15) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 mb-1 font-medium">
                      <span>Repository Health & License:</span>
                      <span className="font-mono font-bold text-slate-700">{selectedIssue.rubric.repoHealthScore}/10</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-slate-400 h-full rounded-full" style={{ width: `${(selectedIssue.rubric.repoHealthScore / 10) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 mb-1 font-medium">
                      <span>Freshness & Activity:</span>
                      <span className="font-mono font-bold text-slate-700">{selectedIssue.rubric.freshnessScore}/10</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-slate-400 h-full rounded-full" style={{ width: `${(selectedIssue.rubric.freshnessScore / 10) * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <span className="text-slate-600 font-semibold">Evaluation Rationale:</span>
                  <p className="text-slate-700 leading-relaxed">{selectedIssue.rubric.rationale}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 space-y-1 text-xs">
                  <span className="text-teal-800 font-semibold">Recommended Next Action:</span>
                  <p className="text-teal-900 font-medium">{selectedIssue.recommendedNextStep}</p>
                </div>

                <Link
                  href={`/contributions?issue=${selectedIssue.id}`}
                  className="w-full mt-2 px-4 py-2.5 rounded-xl omni-btn-primary text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <GitPullRequest className="w-4 h-4" />
                  <span>Launch Workbench for Issue #{selectedIssue.issueNumber}</span>
                </Link>
              </div>
            ) : (
              <div className="omni-card border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500 shadow-sm">
                Select an issue candidate to inspect its explainable rubric breakdown.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GitHub Trending */}
      {activeTab === "trending" && (
        <div className="space-y-5">
          <div className="omni-card border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <span className="text-xs text-slate-600 font-medium">
              Discovers trending repositories aligned with your tech stack without downloading code.
            </span>
            <div className="flex items-center gap-2 text-xs">
              {["Python", "Go", "TypeScript", "ALL"].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setTrendingLang(lang)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    trendingLang === lang
                      ? "bg-teal-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredTrending.map((trend) => (
              <div
                key={trend.repoFullName}
                className="omni-card border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-mono">{trend.repoFullName}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{trend.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-teal-700 font-bold text-sm">+{trend.starsToday}★</span>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Today</p>
                    </div>
                    <a
                      href={trend.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition border border-slate-200 shadow-xs"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <p className="text-slate-700">
                    <span className="font-semibold text-slate-900">Why it matches you:</span> {trend.matchReason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Pull Requests & Contribution History */}
      {activeTab === "prs" && (
        <div className="space-y-5">
          <div className="omni-card border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-teal-600" />
              Verified Pull Request History
            </h3>
            <p className="text-xs text-slate-500">
              Only verified remote events are logged. Local workbench drafts are not counted as merged PRs.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      MERGED #1
                    </span>
                    <span className="font-semibold text-slate-900">
                      feat: add resnet50 backbone and mixed precision training
                    </span>
                  </div>
                  <p className="text-slate-500 font-mono text-[11px] mt-1">
                    badrisatyam1-ctrl/wafer-defect-classification
                  </p>
                </div>
                <span className="text-slate-500 text-[11px] font-medium">Merged on 2026-09-15</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      MERGED #2
                    </span>
                    <span className="font-semibold text-slate-900">
                      docs: add model architecture and benchmark evaluation instructions
                    </span>
                  </div>
                  <p className="text-slate-500 font-mono text-[11px] mt-1">
                    badrisatyam1-ctrl/wafer-defect-classification
                  </p>
                </div>
                <span className="text-slate-500 text-[11px] font-medium">Merged on 2026-09-22</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
