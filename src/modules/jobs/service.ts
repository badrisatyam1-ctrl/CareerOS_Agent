import {
  JobOpeningItem,
  JobFilters,
  MatchExplanation,
  ApplicationStage,
} from "./types";
import { calculateJobMatch, computeJobDedupeKey, detectSuspiciousOrExpired } from "./matcher";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

export class JobDiscoveryService {
  private jobs: JobOpeningItem[] = [
    {
      id: "job-stripe-infra-2025",
      canonicalUrl: "https://boards.greenhouse.io/stripe/jobs/swe-intern-infra-2025",
      companyName: "Stripe",
      roleTitle: "Software Engineering Intern - Infrastructure",
      location: "Remote (India)",
      workMode: "REMOTE",
      roleType: "INTERN",
      description: "Build robust distributed backend payment rails in Go, TypeScript, and SQL. Open to 2026/2027/2028 graduates. High-throughput concurrency and reliable event pipelines.",
      postedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      firstSeenAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      dedupeHash: computeJobDedupeKey(
        "https://boards.greenhouse.io/stripe/jobs/swe-intern-infra-2025",
        "Stripe",
        "Software Engineering Intern - Infrastructure",
        "Remote (India)"
      ),
      status: "ACTIVE",
      salaryOrStipend: "₹1,25,000 / month",
      isPaid: true,
      sourcePlatform: "GREENHOUSE_PUBLIC",
      minGraduationYear: 2026,
      maxGraduationYear: 2028,
      requiredSkills: ["TypeScript", "SQL", "Git", "REST APIs", "DSA"],
      preferredSkills: ["Go", "Redis", "Distributed Systems"],
      recruiterEmail: "ananya.recruiter.demo@stripe.example.com",
      recruiterEmailProvenanceUrl: "https://stripe.com/jobs/university",
    },
    {
      id: "job-qualcomm-edge-ai",
      canonicalUrl: "https://qualcomm.wd5.myworkdayjobs.com/en-US/Careers/job/edge-ai-intern-noida",
      companyName: "Qualcomm",
      roleTitle: "Edge AI & Computer Vision Intern",
      location: "Noida / Greater Noida, India",
      workMode: "HYBRID",
      roleType: "INTERN",
      description: "Deploy PyTorch CNN models to edge NPUs and camera pipelines. Work on quantization, defect classification, and latency benchmarks.",
      postedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      firstSeenAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      dedupeHash: computeJobDedupeKey(
        "https://qualcomm.wd5.myworkdayjobs.com/en-US/Careers/job/edge-ai-intern-noida",
        "Qualcomm",
        "Edge AI & Computer Vision Intern",
        "Noida / Greater Noida, India"
      ),
      status: "ACTIVE",
      salaryOrStipend: "₹65,000 / month",
      isPaid: true,
      sourcePlatform: "COMPANY_SITE",
      minGraduationYear: 2026,
      maxGraduationYear: 2028,
      requiredSkills: ["Python", "PyTorch", "Computer Vision", "Linux"],
      preferredSkills: ["ONNX", "Edge ML", "Quantization"],
    },
    {
      id: "job-datadog-systems-intern",
      canonicalUrl: "https://jobs.lever.co/datadog/systems-swe-intern",
      companyName: "Datadog",
      roleTitle: "Systems Software Engineer Intern",
      location: "Bengaluru, India",
      workMode: "HYBRID",
      roleType: "INTERN",
      description: "Work on high-throughput telemetry pipelines and agent collectors in Python, Go, and Linux systems internals.",
      postedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      firstSeenAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      dedupeHash: computeJobDedupeKey(
        "https://jobs.lever.co/datadog/systems-swe-intern",
        "Datadog",
        "Systems Software Engineer Intern",
        "Bengaluru, India"
      ),
      status: "ACTIVE",
      salaryOrStipend: "₹90,000 / month",
      isPaid: true,
      sourcePlatform: "LEVER_PUBLIC",
      minGraduationYear: 2026,
      maxGraduationYear: 2028,
      requiredSkills: ["Python", "Docker", "Linux", "Data Structures"],
      preferredSkills: ["Go", "Kafka", "Telemetry"],
    },
    {
      id: "job-ti-embedded-iot",
      canonicalUrl: "https://careers.ti.com/job/embedded-software-intern-noida",
      companyName: "Texas Instruments",
      roleTitle: "Embedded IoT Software Intern",
      location: "Noida, India",
      workMode: "ON_SITE",
      roleType: "INTERN",
      description: "Develop firmware, peripheral drivers, and sensor communication over I2C/SPI on microcontrollers (ESP32/ARM Cortex).",
      postedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      firstSeenAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      dedupeHash: computeJobDedupeKey(
        "https://careers.ti.com/job/embedded-software-intern-noida",
        "Texas Instruments",
        "Embedded IoT Software Intern",
        "Noida, India"
      ),
      status: "ACTIVE",
      salaryOrStipend: "₹50,000 / month",
      isPaid: true,
      sourcePlatform: "COMPANY_SITE",
      minGraduationYear: 2026,
      maxGraduationYear: 2028,
      requiredSkills: ["C++", "Embedded C", "Git", "Linux"],
      preferredSkills: ["ESP32", "FreeRTOS", "I2C/SPI"],
    },
    {
      id: "job-legacy-senior-staff",
      canonicalUrl: "https://boards.greenhouse.io/demo/senior-staff-ml",
      companyName: "Legacy Defense Corp",
      roleTitle: "Senior Staff Machine Learning Architect",
      location: "New Delhi, India",
      workMode: "ON_SITE",
      roleType: "FULL_TIME",
      description: "Must have graduated by 2020 or earlier with 8+ years of industry experience. US Citizenship required.",
      postedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      firstSeenAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      dedupeHash: computeJobDedupeKey(
        "https://boards.greenhouse.io/demo/senior-staff-ml",
        "Legacy Defense Corp",
        "Senior Staff Machine Learning Architect",
        "New Delhi, India"
      ),
      status: "ACTIVE",
      salaryOrStipend: "₹45,00,000 / year",
      isPaid: true,
      sourcePlatform: "GREENHOUSE_PUBLIC",
      maxGraduationYear: 2020, // Ineligible for Badri (2028)
      requiredSkills: ["Python", "PyTorch", "Distributed Systems"],
      preferredSkills: ["Kubernetes", "Ray"],
    },
  ];

  private stageMap: Map<string, ApplicationStage> = new Map([
    ["job-stripe-infra-2025", "SHORTLISTED"],
    ["job-qualcomm-edge-ai", "DISCOVERED"],
    ["job-datadog-systems-intern", "DISCOVERED"],
    ["job-ti-embedded-iot", "DISCOVERED"],
    ["job-legacy-senior-staff", "DISCOVERED"],
  ]);

  /**
   * Retrieves all jobs filtered and scored against the user's confirmed profile
   */
  public getScoredJobs(
    filters?: Partial<JobFilters>,
    userGraduationYear: number = 2028
  ): Array<{ job: JobOpeningItem; match: MatchExplanation; stage: ApplicationStage }> {
    const results: Array<{ job: JobOpeningItem; match: MatchExplanation; stage: ApplicationStage }> = [];

    for (const job of this.jobs) {
      const match = calculateJobMatch(job, userGraduationYear);
      const stage = this.stageMap.get(job.id) || "DISCOVERED";

      // Filter checks
      if (filters?.roleType && filters.roleType !== "ALL" && job.roleType !== filters.roleType) {
        continue;
      }
      if (filters?.workMode && filters.workMode !== "ALL" && job.workMode !== filters.workMode) {
        continue;
      }
      if (filters?.paidOnly && !job.isPaid) {
        continue;
      }
      if (filters?.eligibilityOnly && match.eligibilityStatus !== "ELIGIBLE") {
        continue;
      }
      if (filters?.stage && filters.stage !== "ALL" && stage !== filters.stage) {
        continue;
      }

      results.push({ job, match, stage });
    }

    // Sort by overall fit score descending
    return results.sort((a, b) => b.match.overallFitScore - a.match.overallFitScore);
  }

  /**
   * Updates application tracking stage
   */
  public async updateJobStage(
    userId: string,
    jobId: string,
    newStage: ApplicationStage
  ): Promise<{ success: boolean; newStage: ApplicationStage }> {
    this.stageMap.set(jobId, newStage);
    logger.info("JOB_DISCOVERY", `Updated application stage for job ${jobId} to ${newStage}`, {
      userId,
      jobId,
      newStage,
    });

    try {
      await prisma.auditEvent.create({
        data: {
          userId,
          actorType: "USER",
          moduleName: "JOB_DISCOVERY",
          actionName: "STAGE_UPDATED",
          targetResource: jobId,
          status: "SUCCESS",
          detailsRedacted: JSON.stringify({ jobId, newStage }),
        },
      });
    } catch {
      // Prisma fallback
    }

    return { success: true, newStage };
  }

  /**
   * Deduplicates incoming job listing by canonical hash
   */
  public addOrDeduplicateJob(newJob: JobOpeningItem): { added: boolean; reason?: string } {
    const existing = this.jobs.find((j) => j.dedupeHash === newJob.dedupeHash);
    if (existing) {
      return { added: false, reason: "Duplicate job listing detected (matched canonical hash)." };
    }

    const { isExpired, isSuspicious, reasons } = detectSuspiciousOrExpired(newJob);
    if (isExpired) {
      return { added: false, reason: `Listing rejected: ${reasons.join(", ")}` };
    }
    if (isSuspicious) {
      return { added: false, reason: `Listing rejected: ${reasons.join(", ")}` };
    }

    this.jobs.push(newJob);
    this.stageMap.set(newJob.id, "DISCOVERED");
    return { added: true };
  }
}
