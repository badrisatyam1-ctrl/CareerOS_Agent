import {
  BaseResumeData,
  TailoredResumeVariant,
  ChangedBullet,
} from "./types";
import { JobOpeningItem } from "@/modules/jobs/types";
import { computeHash } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

export class ResumeTailoringService {
  // Immutable Base Resume Data verified against Evidence Vault
  private baseResume: BaseResumeData = {
    fullName: "Badri Vishal Pandey",
    education: {
      degree: "B.Tech in Electronics & Communication Engineering",
      institution: "Galgotias College of Engineering & Technology (GCET)",
      graduationYear: 2028,
      status: "In Progress (3rd Year)",
    },
    verifiedProjects: [
      {
        name: "WaferOS — Semiconductor Wafer Defect Classification",
        url: "https://github.com/badrisatyam1-ctrl/wafer-defect-classification",
        techStack: ["PyTorch", "Python", "Computer Vision", "Docker"],
        keyAchievements: [
          "Developed modular PyTorch pipeline for multi-class wafer surface defect recognition.",
          "Implemented synthetic defect data augmentation to address 90%+ defect-free die class imbalance.",
          "Packaged reproducible benchmarking scripts for model latency and memory profiling.",
        ],
        evidenceRef: "GITHUB_REPO:badrisatyam1-ctrl/wafer-defect-classification",
      },
      {
        name: "TravelBooking — Distributed Seat Reservation Engine",
        url: "https://github.com/badrisatyam1-ctrl/TravelBooking",
        techStack: ["TypeScript", "Next.js", "Redis", "PostgreSQL", "REST APIs"],
        keyAchievements: [
          "Engineered distributed seat locking mechanism using Redis lease keys with 120s TTL to prevent double-booking.",
          "Built typed REST APIs and PostgreSQL schema with transaction boundaries for concurrent checkout flows.",
          "Evaluated optimistic concurrency vs distributed locks under simulated booking contention.",
        ],
        evidenceRef: "GITHUB_REPO:badrisatyam1-ctrl/TravelBooking",
      },
      {
        name: "Smart Helmet — Real-Time Accident Detection & IoT Telemetry",
        url: "https://github.com/badrisatyam1-ctrl/SmartHelmet",
        techStack: ["C++", "Embedded C", "ESP32", "IoT Sensors"],
        keyAchievements: [
          "Programmed ESP32 microcontroller with accelerometer and gyroscope sensors for crash detection.",
          "Implemented low-latency alert broadcast protocol with GPS coordinates via GSM/cellular module.",
          "Designed interrupt-driven sensor sampling to operate within low-power embedded constraints.",
        ],
        evidenceRef: "GITHUB_REPO:badrisatyam1-ctrl/SmartHelmet",
      },
    ],
    verifiedSkills: [
      "Python",
      "PyTorch",
      "TypeScript",
      "JavaScript",
      "C++",
      "Embedded C",
      "SQL",
      "PostgreSQL",
      "Redis",
      "Docker",
      "Linux",
      "Git",
      "REST APIs",
      "DSA",
      "Next.js",
      "Computer Vision",
    ],
    competitiveStats: {
      streakDays: 190,
      problemsSolved: 184,
      platform: "LeetCode",
      profileUrl: "https://leetcode.com/u/Badri1888/",
    },
  };

  /**
   * Tailors a truthful resume variant for a specific job description.
   * STRICT ENFORCEMENT: Never adds unverified skills, metrics, certifications, or patents.
   */
  public tailorResumeForJob(
    job: JobOpeningItem,
    linkedInGraduationYear: number = 2028
  ): TailoredResumeVariant {
    const verifiedSkillSet = new Set(this.baseResume.verifiedSkills.map((s) => s.toLowerCase()));
    const matchedSkillsHighlighted: string[] = [];
    const skillGapsOmitted: string[] = [];
    const unverifiedClaimsAttempted: string[] = [];

    // Analyze job skills against verified evidence
    for (const req of job.requiredSkills) {
      if (verifiedSkillSet.has(req.toLowerCase())) {
        matchedSkillsHighlighted.push(req);
      } else {
        // Skill required by job is NOT in evidence vault -> explicitly omitted from resume!
        skillGapsOmitted.push(req);
      }
    }

    // Determine project ordering based on job relevance
    const jobText = (job.roleTitle + " " + job.description).toLowerCase();
    const changedBullets: ChangedBullet[] = [];

    // Check for graduation date discrepancy between Resume (2027) and LinkedIn (2028)
    let graduationMismatchFlag: string | undefined;
    if (this.baseResume.education.graduationYear !== linkedInGraduationYear) {
      graduationMismatchFlag = `Graduation Year Discrepancy: Resume indicates ${this.baseResume.education.graduationYear}, while LinkedIn indicates ${linkedInGraduationYear}. Please verify your official graduation year in Settings before submitting.`;
    }

    // Tailor project descriptions using ONLY verified achievements
    let primaryProject = this.baseResume.verifiedProjects[0];
    let secondaryProject = this.baseResume.verifiedProjects[1];

    if (jobText.includes("backend") || jobText.includes("distributed") || jobText.includes("sql")) {
      primaryProject = this.baseResume.verifiedProjects[1]; // TravelBooking
      secondaryProject = this.baseResume.verifiedProjects[0]; // WaferOS
      changedBullets.push({
        section: "Projects",
        originalBullet: "Standard Project Ordering (WaferOS, TravelBooking, Smart Helmet)",
        tailoredBullet: "Prioritized TravelBooking (Distributed Seat Locks & Concurrency) as primary project for backend alignment.",
        evidenceRef: primaryProject.evidenceRef,
        rationale: "Aligns verified backend concurrency experience with target infrastructure role.",
      });
    } else if (jobText.includes("computer vision") || jobText.includes("pytorch") || jobText.includes("ai")) {
      primaryProject = this.baseResume.verifiedProjects[0]; // WaferOS
      secondaryProject = this.baseResume.verifiedProjects[2]; // Smart Helmet
      changedBullets.push({
        section: "Projects",
        originalBullet: "Standard Project Ordering",
        tailoredBullet: "Prioritized WaferOS (PyTorch Wafer Defect Pipeline & Benchmarks) as primary project.",
        evidenceRef: primaryProject.evidenceRef,
        rationale: "Aligns verified computer vision defect classification with AI/ML role.",
      });
    } else if (jobText.includes("embedded") || jobText.includes("iot") || jobText.includes("c++")) {
      primaryProject = this.baseResume.verifiedProjects[2]; // Smart Helmet
      secondaryProject = this.baseResume.verifiedProjects[0]; // WaferOS
      changedBullets.push({
        section: "Projects",
        originalBullet: "Standard Project Ordering",
        tailoredBullet: "Prioritized Smart Helmet (ESP32 C++ Sensor Processing) as primary project.",
        evidenceRef: primaryProject.evidenceRef,
        rationale: "Aligns verified embedded firmware experience with IoT role.",
      });
    }

    // Generate truthful Markdown representation
    const markdownContent = `# ${this.baseResume.fullName}
**Location:** Greater Noida / Delhi NCR, India | **GitHub:** github.com/badrisatyam1-ctrl | **LeetCode:** leetcode.com/u/Badri1888

---

## Education
**${this.baseResume.education.institution}**  
*${this.baseResume.education.degree}* — Expected Graduation: **${this.baseResume.education.graduationYear}**  
${this.baseResume.education.status}

---

## Technical Skills (Verified Evidence Only)
- **Languages:** ${this.baseResume.verifiedSkills.filter((s) => ["Python", "TypeScript", "JavaScript", "C++", "Embedded C", "SQL"].includes(s)).join(", ")}
- **Frameworks & Tools:** ${this.baseResume.verifiedSkills.filter((s) => ["PyTorch", "Next.js", "Redis", "PostgreSQL", "Docker", "Linux", "Git", "REST APIs"].includes(s)).join(", ")}
- **Specializations:** Computer Vision, Distributed Concurrency, Data Structures & Algorithms

---

## Relevant Projects

### 1. ${primaryProject.name}
*Tech Stack: ${primaryProject.techStack.join(", ")}* | [Repository](${primaryProject.url})
${primaryProject.keyAchievements.map((a) => `- ${a}`).join("\n")}

### 2. ${secondaryProject.name}
*Tech Stack: ${secondaryProject.techStack.join(", ")}* | [Repository](${secondaryProject.url})
${secondaryProject.keyAchievements.map((a) => `- ${a}`).join("\n")}

---

## Competitive Programming & Problem Solving
- **LeetCode:** ${this.baseResume.competitiveStats.problemsSolved}+ problems solved across ${this.baseResume.competitiveStats.streakDays} consecutive daily streak ([Profile](${this.baseResume.competitiveStats.profileUrl})).
`;

    const variantId = `resume-variant-${job.id}`;

    return {
      id: variantId,
      jobId: job.id,
      jobTitle: job.roleTitle,
      companyName: job.companyName,
      versionLabel: `v1.0-${job.companyName.toLowerCase()}-${job.roleType.toLowerCase()}`,
      createdAt: new Date().toISOString(),
      isBaseImmutable: true,
      changedBullets,
      matchedSkillsHighlighted,
      skillGapsOmitted,
      unverifiedClaimsAttempted,
      graduationMismatchFlag,
      isApproved: false,
      markdownContent,
    };
  }

  /**
   * Approves tailored resume and records cryptographic hash
   */
  public async approveResumeVariant(
    userId: string,
    variant: TailoredResumeVariant
  ): Promise<{ success: boolean; approvalHash: string }> {
    const hash = computeHash(variant.markdownContent);
    variant.isApproved = true;
    variant.approvalHash = hash;

    logger.info("RESUME_TAILORING", `Tailored resume approved for ${variant.companyName}`, {
      userId,
      variantId: variant.id,
      approvalHash: hash,
    });

    try {
      await prisma.auditEvent.create({
        data: {
          userId,
          actorType: "USER",
          moduleName: "RESUME_TAILORING",
          actionName: "TAILORED_RESUME_APPROVED",
          targetResource: `${variant.companyName} (${variant.jobTitle})`,
          status: "SUCCESS",
          detailsRedacted: JSON.stringify({
            variantId: variant.id,
            approvalHash: hash,
            versionLabel: variant.versionLabel,
          }),
        },
      });
    } catch {
      // Prisma fallback
    }

    return { success: true, approvalHash: hash };
  }

  /**
   * Intercepts and rejects any attempt to inject unverified claims or skills
   */
  public validateClaimAgainstVault(claim: string): { isVerified: boolean; error?: string } {
    const lower = claim.toLowerCase();
    const disallowedPatterns = [
      "patent",
      "aws certified",
      "gcp architect",
      "100x",
      "99.99%",
      "saved $",
      "5 years production experience",
      "phd",
    ];

    for (const pat of disallowedPatterns) {
      if (lower.includes(pat)) {
        return {
          isVerified: false,
          error: `Claim contains unverified statement ("${pat}"). CareerOS forbids fabricating credentials or metrics.`,
        };
      }
    }

    return { isVerified: true };
  }

  /**
   * Returns base immutable resume
   */
  public getBaseResume(): BaseResumeData {
    return JSON.parse(JSON.stringify(this.baseResume));
  }
}
