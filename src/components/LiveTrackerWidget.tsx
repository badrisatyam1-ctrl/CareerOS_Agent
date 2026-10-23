"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Flame,
  Award,
  ExternalLink,
  RefreshCw,
  GitBranch,
  Star,
  CheckCircle2,
  Code,
  Calendar,
} from "lucide-react";
import { LeetCodeStats, GitHubStats } from "@/modules/tracker/types";
import { VERIFIED_LEETCODE_SNAPSHOT, VERIFIED_GITHUB_SNAPSHOT } from "@/modules/tracker/service";

export default function LiveTrackerWidget() {
  const [leetcode, setLeetcode] = useState<LeetCodeStats>(VERIFIED_LEETCODE_SNAPSHOT);
  const [github, setGithub] = useState<GitHubStats>(VERIFIED_GITHUB_SNAPSHOT);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedText, setLastUpdatedText] = useState("Just now");

  const syncStats = async () => {
    setIsRefreshing(true);
    try {
      const [lcRes, ghRes] = await Promise.all([
        fetch("/api/tracker/leetcode"),
        fetch("/api/tracker/github"),
      ]);

      if (lcRes.ok) {
        const lcData = await lcRes.json();
        setLeetcode(lcData);
      }
      if (ghRes.ok) {
        const ghData = await ghRes.json();
        setGithub(ghData);
      }
      setLastUpdatedText("Just now");
    } catch {
      // Fallback already in place
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    syncStats();
    const interval = setInterval(syncStats, 60000); // Auto-sync every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="omni-card rounded-2xl p-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
            <Activity className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Live Real-Time Telemetry</h3>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[11px] font-mono border border-teal-200 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
                {leetcode.isLive ? "LIVE SYNCED" : "VERIFIED SNAPSHOT"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live tracking verified engineering signals across LeetCode & GitHub for Badri Vishal Pandey.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Updated: {lastUpdatedText}</span>
          <button
            type="button"
            onClick={syncStats}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition border border-slate-200 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-teal-600" : "text-slate-500"}`} />
            <span>{isRefreshing ? "Syncing..." : "Sync Now"}</span>
          </button>
        </div>
      </div>

      {/* Two columns: LeetCode & GitHub */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LeetCode Live Card */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold text-xs">
                LC
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  LeetCode Tracker
                  <span className="text-xs font-mono text-slate-500 font-normal">(@{leetcode.username})</span>
                </h4>
                <p className="text-[11px] text-slate-500">Contest Rating: {leetcode.contestRating} • Rank #{leetcode.ranking.toLocaleString()}</p>
              </div>
            </div>
            <a
              href={leetcode.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition border border-slate-200 shadow-xs"
              title="Open LeetCode Profile"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Primary stats counter */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
              <span className="text-xl font-bold text-slate-900 font-mono">{leetcode.totalSolved}</span>
              <p className="text-[10px] text-slate-500 mt-0.5">Problems Solved</p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-xl font-bold text-amber-600 font-mono">{leetcode.maxStreakDays}d</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Max Streak</p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span className="text-xl font-bold text-teal-700 font-mono">{leetcode.totalActiveDays}d</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Active Days</p>
            </div>
          </div>

          {/* Difficulty breakdown */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-[11px] font-medium text-slate-500">Problem Breakdown</span>
              <span className="font-mono text-[11px] text-slate-500">{leetcode.submissionsPastYear} submissions past year</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-center">
                <span className="font-bold text-teal-700 font-mono">{leetcode.easySolved}</span>
                <span className="text-[10px] text-teal-800 font-medium block">Easy</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-center">
                <span className="font-bold text-amber-700 font-mono">{leetcode.mediumSolved}</span>
                <span className="text-[10px] text-amber-800 font-medium block">Medium</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-center">
                <span className="font-bold text-rose-700 font-mono">{leetcode.hardSolved}</span>
                <span className="text-[10px] text-rose-800 font-medium block">Hard</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 pt-1">
            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[11px] text-slate-500 font-medium">Latest Badge:</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
              {leetcode.recentBadges[0]}
            </span>
          </div>
        </div>

        {/* GitHub Live Card */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center font-bold text-xs">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  GitHub Tracker
                  <span className="text-xs font-mono text-slate-500 font-normal">(@{github.username})</span>
                </h4>
                <p className="text-[11px] text-slate-500">{github.publicReposCount} Public Repos • {github.followersCount} Followers • {github.totalStarsEarned} Stars</p>
              </div>
            </div>
            <a
              href={github.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition border border-slate-200 shadow-xs"
              title="Open GitHub Profile"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Active Repositories List */}
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-slate-500 block">Recent Verified Repositories</span>
            <div className="space-y-1.5">
              {github.recentActiveRepos.map((repo) => (
                <a
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-teal-400 transition flex items-center justify-between text-xs group shadow-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-slate-800 group-hover:text-teal-700 transition font-mono">
                      {repo.name}
                    </span>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{repo.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600 border border-slate-200">
                      {repo.language}
                    </span>
                    {repo.stars > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-600 font-mono text-[11px] font-semibold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {repo.stars}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1 text-teal-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Verified commit provenance
            </span>
            <span className="font-mono">{github.recentCommitEventsCount} recent contribution events</span>
          </div>
        </div>
      </div>
    </div>
  );
}
