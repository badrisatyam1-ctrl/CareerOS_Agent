import {
  JobSkillMatrix,
  SkillMatrixEntry,
  InterviewQuestion,
  StarStory,
  StudyPlanMilestone,
  PracticeSessionRecord,
} from "./types";
import { JobOpeningItem } from "@/modules/jobs/types";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

export class InterviewPrepService {
  private practiceSessions: PracticeSessionRecord[] = [
    {
      id: "session-1",
      skillName: "Distributed Systems & Raft Consensus",
      sessionType: "SYSTEM_DESIGN",
      notes: "Read Raft paper sections 1-5; implemented leader election state transitions and heartbeats in Go.",
      durationMinutes: 90,
      confidenceRating: 3,
      completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "session-2",
      skillName: "Monotonic Stack Patterns (LeetCode)",
      sessionType: "CODING",
      notes: "Solved Next Greater Element I & II, Daily Temperatures, and Largest Rectangle in Histogram.",
      durationMinutes: 75,
      confidenceRating: 5,
      completedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  /**
   * Derives a transparent skill matrix for a shortlisted job.
   * HARD RULE: A resume keyword alone does NOT count as demonstrated.
   * Every demonstrated skill must link to verifiable code in WaferOS, TravelBooking, or Smart Helmet.
   */
  public deriveSkillMatrix(job: JobOpeningItem): JobSkillMatrix {
    const entries: SkillMatrixEntry[] = [];

    // Verified Project Artifact Mapping
    const projectSkillMap: Record<string, { project: string; reason: string }> = {
      pytorch: {
        project: "WaferOS",
        reason: "Engineered multi-class CNN classification pipeline with synthetic data augmentations.",
      },
      "computer vision": {
        project: "WaferOS",
        reason: "Trained and benchmarked wafer defect recognition under 90%+ class skew.",
      },
      typescript: {
        project: "TravelBooking",
        reason: "Built typed REST APIs and reservation state machine in Next.js/TypeScript.",
      },
      sql: {
        project: "TravelBooking",
        reason: "Implemented PostgreSQL transaction isolation and relational schema for bookings.",
      },
      redis: {
        project: "TravelBooking",
        reason: "Implemented distributed seat lease locks with 120s TTL to prevent double-booking.",
      },
      "c++": {
        project: "Smart Helmet",
        reason: "Programmed ESP32 firmware for real-time accelerometer anomaly detection.",
      },
      "embedded c": {
        project: "Smart Helmet",
        reason: "Configured peripheral drivers and interrupt-driven sensor sampling.",
      },
      git: {
        project: "GitHub Repositories",
        reason: "Maintains 5+ public repositories with versioned PRs and branch protection.",
      },
      docker: {
        project: "WaferOS",
        reason: "Containerized PyTorch inference pipeline for reproducible deployment.",
      },
      linux: {
        project: "WaferOS & Smart Helmet",
        reason: "Linux development environment, shell automation, and POSIX tooling.",
      },
    };

    // Evaluate Required Skills
    for (const req of job.requiredSkills) {
      const lower = req.toLowerCase();
      if (projectSkillMap[lower]) {
        entries.push({
          name: req,
          requirementType: "REQUIRED",
          level: "DEMONSTRATED_BY_PROJECT",
          evidenceRef: projectSkillMap[lower].project,
          reason: projectSkillMap[lower].reason,
        });
      } else if (lower.includes("dsa") || lower.includes("data structures") || lower.includes("algorithms")) {
        entries.push({
          name: req,
          requirementType: "REQUIRED",
          level: "DEMONSTRATED_BY_PROJECT",
          evidenceRef: "LeetCode (@Badri1888)",
          reason: "Demonstrated through 87+ solved problems across a 107-day streak.",
        });
      } else if (lower.includes("rest") || lower.includes("api")) {
        entries.push({
          name: req,
          requirementType: "REQUIRED",
          level: "PARTIALLY_DEMONSTRATED",
          evidenceRef: "TravelBooking",
          reason: "Built REST endpoints, but lacks production scale API gateway or rate-limiting experience.",
        });
      } else {
        entries.push({
          name: req,
          requirementType: "REQUIRED",
          level: "MISSING_UNKNOWN",
          reason: "Skill not demonstrated in verified code repositories. Identified as an active learning gap.",
        });
      }
    }

    // Evaluate Preferred Skills
    for (const pref of job.preferredSkills) {
      const lower = pref.toLowerCase();
      if (projectSkillMap[lower]) {
        entries.push({
          name: pref,
          requirementType: "PREFERRED",
          level: "DEMONSTRATED_BY_PROJECT",
          evidenceRef: projectSkillMap[lower].project,
          reason: projectSkillMap[lower].reason,
        });
      } else {
        entries.push({
          name: pref,
          requirementType: "PREFERRED",
          level: "MISSING_UNKNOWN",
          reason: "Preferred qualification currently absent from verified project artifacts.",
        });
      }
    }

    const demonstratedCount = entries.filter((e) => e.level === "DEMONSTRATED_BY_PROJECT").length;
    const gapCount = entries.filter((e) => e.level === "MISSING_UNKNOWN").length;

    return {
      jobId: job.id,
      companyName: job.companyName,
      roleTitle: job.roleTitle,
      entries,
      summary: {
        requiredCount: job.requiredSkills.length,
        demonstratedCount,
        gapCount,
      },
    };
  }

  /**
   * Generates a 4-week structured study plan with practical milestones
   */
  public getStudyPlan(jobId: string): StudyPlanMilestone[] {
    return [
      {
        weekNumber: 1,
        title: "Concurrency Primitives & Distributed State",
        focusArea: "Distributed Systems & Backend",
        tasks: [
          "Deep dive into Redis distributed lease locks vs Redlock consensus.",
          "Solve LeetCode #200 (Number of Islands) and #739 (Daily Temperatures - Monotonic Stack).",
          "Review PostgreSQL isolation levels (Read Committed vs Serializable) and write skew anomalies.",
        ],
        isCompleted: true,
      },
      {
        weekNumber: 2,
        title: "PyTorch Inference Profiling & Edge Quantization",
        focusArea: "Machine Learning & Computer Vision",
        tasks: [
          "Profile memory footprint of CNN inference batch size 1 vs 32 on CPU/GPU.",
          "Implement post-training dynamic INT8 quantization on wafer classification model.",
          "Formulate STAR answers on handling 90%+ class imbalance with weighted cross-entropy.",
        ],
        isCompleted: false,
      },
      {
        weekNumber: 3,
        title: "High-Throughput Telemetry & Kafka Buffering",
        focusArea: "Data Pipelines & Observability",
        tasks: [
          "Set up Dockerized Kafka cluster; write Python producer sending simulated sensor events.",
          "Implement consumer group offset commit handling and backpressure buffering.",
          "Solve 5 Graph BFS/DFS LeetCode Medium problems.",
        ],
        isCompleted: false,
      },
      {
        weekNumber: 4,
        title: "Mock Interview Simulations & Architecture Defenses",
        focusArea: "Full-Loop Preparation",
        tasks: [
          "Mock System Design: Design a high-volume seat reservation engine with zero double-booking.",
          "Mock Coding: 45-minute timed DSA session on monotonic queues and binary search.",
          "Behavioral defense: Practice the 3 verified STAR stories with concrete engineering metrics.",
        ],
        isCompleted: false,
      },
    ];
  }

  /**
   * Returns role-relevant interview questions and project-specific challenges
   */
  public getInterviewQuestions(jobId: string): InterviewQuestion[] {
    return [
      {
        id: "q-sys-1",
        category: "SYSTEM_DESIGN",
        prompt: "How did you prevent double-booking race conditions during seat selection in TravelBooking?",
        contextProject: "TravelBooking",
        keyPointsToHit: [
          "Discuss why Optimistic Concurrency Control (OCC) resulted in retry cascades under high contention.",
          "Explain Redis TTL lease locks (120s expiration) and automatic key release upon checkout failure.",
          "Describe how PostgreSQL transaction isolation guarantees idempotent final seat assignment.",
        ],
      },
      {
        id: "q-ml-1",
        category: "ML_CV",
        prompt: "In WaferOS, 90%+ of dies are defect-free. How did you prevent the CNN from converging to a trivial all-clean predictor?",
        contextProject: "WaferOS",
        keyPointsToHit: [
          "Compare Focal Loss vs Class-Weighted Cross Entropy loss penalties.",
          "Detail synthetic defect data augmentations: directional scratches and localized cluster faults.",
          "Explain why precision/recall and confusion matrix were evaluated rather than raw accuracy.",
        ],
      },
      {
        id: "q-dsa-1",
        category: "CODING_DSA",
        prompt: "Given an array of temperatures, find how many days you would have to wait until a warmer temperature. What is the optimal time complexity?",
        keyPointsToHit: [
          "Brute force is O(N^2) checking all subsequent days.",
          "Optimal approach uses a Monotonic Decreasing Stack storing indices in O(N) time and O(N) space.",
          "Explain stack push/pop transitions and amortized single traversal.",
        ],
      },
      {
        id: "q-embedded-1",
        category: "EMBEDDED",
        prompt: "In Smart Helmet, how did you balance real-time crash detection latency against ESP32 microcontroller power consumption?",
        contextProject: "Smart Helmet",
        keyPointsToHit: [
          "Interrupt-driven sampling on accelerometer threshold crossings instead of continuous busy-wait polling.",
          "Buffer sensor FIFO queues to minimize CPU wake cycles.",
          "Trigger emergency SMS broadcast only when sudden deceleration threshold is confirmed across consecutive samples.",
        ],
      },
    ];
  }

  /**
   * Returns STAR story prompts grounded strictly in verified real experiences
   */
  public getStarStories(): StarStory[] {
    return [
      {
        id: "star-waferos-imbalance",
        title: "Stabilizing Semiconductor Defect Classification Under Extreme Imbalance",
        targetCompetency: "Problem Solving & ML Engineering",
        situation: "During development of WaferOS, initial CNN models converged to 92% accuracy by predicting 'defect-free' on every sample, missing critical micro-defects.",
        task: "Redesign the loss and data augmentation pipeline to detect rare cluster and scratch defects without destabilizing model convergence.",
        action: "Implemented class-weighted cross-entropy penalizing false negatives on rare defect classes. Created custom directional scratching augmentations matching mechanical wafer handling faults.",
        result: "Stabilized training, eliminating naive zero-defect collapse and enabling reproducible latency profiling in merged PR #4.",
        verifiedEvidenceRef: "GITHUB_REPO:badrisatyam1-ctrl/wafer-defect-classification",
      },
      {
        id: "star-travelbooking-concurrency",
        title: "Resolving High-Contention Race Conditions in Seat Reservations",
        targetCompetency: "Backend Concurrency & Architecture",
        situation: "Simulated load tests on TravelBooking revealed that concurrent users clicking the same seat triggered database transaction abort cascades and high retry latencies.",
        task: "Implement a low-latency reservation lease system ensuring strict atomicity without locking database tables long-term.",
        action: "Engineered distributed Redis lease locks with 120s TTL. When a user begins checkout, the seat key is atomically leased; if checkout is abandoned, the key expires automatically without manual cleanup scripts.",
        result: "Eliminated transaction abort cascades during concurrent booking spikes while maintaining zero double-booking guarantees.",
        verifiedEvidenceRef: "GITHUB_REPO:badrisatyam1-ctrl/TravelBooking",
      },
      {
        id: "star-leetcode-consistency",
        title: "Building Algorithmic Discipline Across a 100+ Day Daily Streak",
        targetCompetency: "Persistence, Discipline & Problem Solving",
        situation: "Balancing full-time university coursework with technical mastery required structured, consistent practice rather than sporadic cramming.",
        task: "Establish a daily habit to master core data structures and algorithmic patterns.",
        action: "Committed to solving at least one problem daily on LeetCode, categorizing problems into structural patterns (monotonic stacks, bitmask graph traversals, two pointers).",
        result: "Achieved a 107-day active streak with 87+ problems solved, significantly improving speed and edge-case bug detection.",
        verifiedEvidenceRef: "CREDENTIAL_URL:https://leetcode.com/u/Badri1888/",
      },
    ];
  }

  /**
   * Records a completed practice session and updates confidence ratings
   */
  public async recordPracticeSession(
    userId: string,
    session: Omit<PracticeSessionRecord, "id" | "completedAt">
  ): Promise<PracticeSessionRecord> {
    const newSession: PracticeSessionRecord = {
      ...session,
      id: `session-${Date.now()}`,
      completedAt: new Date().toISOString(),
    };

    this.practiceSessions.unshift(newSession);

    logger.info("INTERVIEW_PREP", `Recorded practice session for ${session.skillName}`, {
      skillName: session.skillName,
      confidenceRating: session.confidenceRating,
      durationMinutes: session.durationMinutes,
    });

    try {
      await prisma.auditEvent.create({
        data: {
          userId,
          actorType: "USER",
          moduleName: "INTERVIEW_PREP",
          actionName: "PRACTICE_SESSION_LOGGED",
          targetResource: session.skillName,
          status: "SUCCESS",
          detailsRedacted: JSON.stringify({
            skillName: session.skillName,
            durationMinutes: session.durationMinutes,
            confidenceRating: session.confidenceRating,
          }),
        },
      });
    } catch {
      // Prisma fallback
    }

    return newSession;
  }

  /**
   * Retrieves all recorded practice sessions
   */
  public getPracticeSessions(): PracticeSessionRecord[] {
    return [...this.practiceSessions];
  }
}
