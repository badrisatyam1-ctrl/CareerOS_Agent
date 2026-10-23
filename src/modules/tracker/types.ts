export interface LeetCodeStats {
  username: string;
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
  ranking: number;
  contestRating?: number;
  contestsAttended?: number;
  currentStreakDays: number;
  maxStreakDays: number;
  totalActiveDays: number;
  submissionsPastYear: number;
  recentBadges: string[];
  lastSyncedAt: string;
  isLive: boolean;
  profileUrl: string;
}

export interface GitHubStats {
  username: string;
  publicReposCount: number;
  followersCount: number;
  followingCount: number;
  totalStarsEarned: number;
  recentActiveRepos: {
    name: string;
    description: string;
    stars: number;
    language: string;
    url: string;
    updatedAt: string;
  }[];
  recentCommitEventsCount: number;
  lastSyncedAt: string;
  isLive: boolean;
  profileUrl: string;
}

export interface LiveTelemetryData {
  leetcode: LeetCodeStats;
  github: GitHubStats;
}
