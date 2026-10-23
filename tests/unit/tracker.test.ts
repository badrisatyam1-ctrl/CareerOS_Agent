import { describe, it, expect } from "vitest";
import { LiveTrackerService, VERIFIED_LEETCODE_SNAPSHOT, VERIFIED_GITHUB_SNAPSHOT } from "@/modules/tracker/service";

describe("Live Real-Time Tracker Service (LeetCode & GitHub)", () => {
  const service = new LiveTrackerService();

  describe("LeetCode Tracking", () => {
    it("should provide verified baseline matching official profile stats", async () => {
      const stats = await service.getLeetCodeStats("Badri1888");

      expect(stats.username).toBe("Badri1888");
      expect(stats.totalSolved).toBeGreaterThanOrEqual(184);
      expect(stats.easySolved).toBeGreaterThanOrEqual(118);
      expect(stats.mediumSolved).toBeGreaterThanOrEqual(62);
      expect(stats.hardSolved).toBeGreaterThanOrEqual(4);
      expect(stats.maxStreakDays).toBeGreaterThanOrEqual(190);
      expect(stats.totalActiveDays).toBeGreaterThanOrEqual(246);
      expect(stats.contestRating).toBe(1550);
      expect(stats.recentBadges).toContain("200 Days Badge 2026");
      expect(stats.profileUrl).toBe("https://leetcode.com/u/Badri1888/");
    });
  });

  describe("GitHub Tracking", () => {
    it("should provide verified repository baseline for badrisatyam1-ctrl", async () => {
      const stats = await service.getGitHubStats("badrisatyam1-ctrl");

      expect(stats.username).toBe("badrisatyam1-ctrl");
      expect(stats.publicReposCount).toBeGreaterThanOrEqual(4);
      expect(stats.recentActiveRepos.length).toBeGreaterThan(0);

      const waferRepo = stats.recentActiveRepos.find((r) => r.name.includes("wafer"));
      expect(waferRepo).toBeDefined();
      expect(waferRepo?.language).toBe("Python");
    });
  });

  describe("Combined Live Telemetry", () => {
    it("should return aggregated telemetry for dashboard consumption", async () => {
      const telemetry = await service.getCombinedTelemetry();

      expect(telemetry.leetcode).toBeDefined();
      expect(telemetry.github).toBeDefined();
      expect(telemetry.leetcode.totalSolved).toBeGreaterThanOrEqual(180);
      expect(telemetry.github.username).toBe("badrisatyam1-ctrl");
    });
  });
});
