import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function main() {
  console.log("🌱 Starting CareerOS Demo Seed...");

  // Clean existing demo records
  await prisma.auditEvent.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.approvalRequest.deleteMany({});
  await prisma.taskRun.deleteMany({});
  await prisma.scheduledTask.deleteMany({});
  await prisma.practiceSession.deleteMany({});
  await prisma.skillGap.deleteMany({});
  await prisma.pullRequestRecord.deleteMany({});
  await prisma.sandboxRun.deleteMany({});
  await prisma.contributionTask.deleteMany({});
  await prisma.issueCandidate.deleteMany({});
  await prisma.repositorySnapshot.deleteMany({});
  await prisma.repositoryWatch.deleteMany({});
  await prisma.linkedInContentDraft.deleteMany({});
  await prisma.outreachEvent.deleteMany({});
  await prisma.outreachDraft.deleteMany({});
  await prisma.networkLead.deleteMany({});
  await prisma.recruiterContact.deleteMany({});
  await prisma.jobApplication.deleteMany({});
  await prisma.jobMatch.deleteMany({});
  await prisma.jobOpening.deleteMany({});
  await prisma.jobSource.deleteMany({});
  await prisma.connectedAccount.deleteMany({});
  await prisma.resumeVersion.deleteMany({});
  await prisma.resumeDocument.deleteMany({});
  await prisma.evidenceFact.deleteMany({});
  await prisma.careerPreferences.deleteMany({});
  await prisma.userProfile.deleteMany({});

  // 1. UserProfile (Badri Vishal Pandey)
  const user = await prisma.userProfile.create({
    data: {
      id: "demo-user-badri",
      email: "badrivishal.pandey.demo@example.com", // clearly marked demo
      fullName: "Badri Vishal Pandey",
      headline: "ECE Undergrad @ GCET | Backend & Systems Engineer | Open Source Explorer",
      location: "Greater Noida, India",
      portfolioUrl: "https://portfolio-bjzy.vercel.app/",
      githubUrl: "https://github.com/badrisatyam1-ctrl",
      linkedinUrl: "https://www.linkedin.com/in/badri-vishal-pandey-0a7913324",
      leetcodeUrl: "https://leetcode.com/u/Badri1888/",
    },
  });

  // 2. CareerPreferences
  await prisma.careerPreferences.create({
    data: {
      userId: user.id,
      targetRoles: ["Software Engineer Intern", "Backend Engineer", "Systems Engineer Intern"],
      targetLocations: ["Remote", "Bengaluru", "Noida", "India"],
      workModes: ["REMOTE", "HYBRID"],
      graduationYear: 2028,
      workAuthorization: "Authorized for internship and full-time employment in India",
      minStipendMonthly: 40000,
      excludedCompanies: ["SpamCorp LLC"],
    },
  });

  // 3. Evidence Facts (from verified public sources)
  const fact1 = await prisma.evidenceFact.create({
    data: {
      userId: user.id,
      factType: "PROJECT_METRIC",
      title: "Wafer Defect Classification System",
      claimValue: "Built deep learning defect detection pipeline for semiconductor manufacturing using PyTorch, achieving 5 stars on GitHub.",
      sourceType: "GITHUB_REPO",
      sourceUrl: "https://github.com/badrisatyam1-ctrl/wafer-defect-classification",
      verificationStatus: "VERIFIED",
      confidenceScore: 1.0,
    },
  });

  const fact2 = await prisma.evidenceFact.create({
    data: {
      userId: user.id,
      factType: "SKILL",
      title: "LeetCode Problem Solving Streak",
      claimValue: "Solved 184 algorithmic problems (118 Easy, 62 Medium, 4 Hard) with a 190-day active streak (200 Days Badge).",
      sourceType: "CERTIFICATE_URL",
      sourceUrl: "https://leetcode.com/u/Badri1888/",
      verificationStatus: "VERIFIED",
      confidenceScore: 0.95,
    },
  });

  const fact3 = await prisma.evidenceFact.create({
    data: {
      userId: user.id,
      factType: "EDUCATION",
      title: "B.Tech in Electronics and Communication Engineering",
      claimValue: "Enrolled in Galgotias College of Engineering and Technology (GCET), Expected Graduation 2028.",
      sourceType: "TRANSCRIPT",
      verificationStatus: "VERIFIED",
      confidenceScore: 1.0,
    },
  });

  // 4. Resume Documents
  const baseResume = await prisma.resumeDocument.create({
    data: {
      userId: user.id,
      fileName: "Badri_Vishal_Pandey_Resume_2025.pdf",
      storagePath: "private-data/resumes/demo_base_resume.pdf", // private protected storage
      fileChecksum: sha256("fake-demo-resume-content-v1"),
      mimeType: "application/pdf",
      isBase: true,
    },
  });

  const resumeVersion = await prisma.resumeVersion.create({
    data: {
      resumeDocId: baseResume.id,
      versionLabel: "v1.0-backend-systems",
      targetRoleType: "Backend Engineer Intern",
      markdownContent: "# Badri Vishal Pandey\n\nBackend & Systems Engineer\n\n- PyTorch, TypeScript, Go\n- Verified Projects: WaferOS, DevSync",
      isApproved: true,
      evidenceFacts: {
        connect: [{ id: fact1.id }, { id: fact2.id }],
      },
    },
  });

  // 5. Connected Accounts (Mock/Demo state)
  await prisma.connectedAccount.createMany({
    data: [
      {
        userId: user.id,
        provider: "GITHUB",
        externalAccountId: "badrisatyam1-ctrl",
        grantedScopes: ["read:user", "repo:status"],
        connectionState: "CONNECTED",
        lastSyncAt: new Date(),
      },
      {
        userId: user.id,
        provider: "GMAIL",
        externalAccountId: "badri.demo@gmail.com",
        grantedScopes: ["https://www.googleapis.com/auth/gmail.compose"],
        connectionState: "CONNECTED",
        lastSyncAt: new Date(),
      },
      {
        userId: user.id,
        provider: "LINKEDIN",
        externalAccountId: "badri-vishal-pandey-demo",
        grantedScopes: ["w_member_social"],
        connectionState: "CONNECTED",
        lastSyncAt: new Date(),
      },
    ],
  });

  // 6. Job Sources & Openings
  const jobSource = await prisma.jobSource.create({
    data: {
      name: "ASHBY_PUBLIC_FEED",
      feedUrl: "https://jobs.ashbyhq.com/api/v1/demo",
      isActive: true,
      lastPolledAt: new Date(),
    },
  });

  const opening1 = await prisma.jobOpening.create({
    data: {
      sourceId: jobSource.id,
      canonicalUrl: "https://boards.greenhouse.io/demo/jobs/backend-intern-2025",
      companyName: "Stripe",
      roleTitle: "Software Engineering Intern - Infrastructure",
      location: "Remote (India)",
      workMode: "REMOTE",
      roleType: "INTERN",
      description: "Build robust distributed backend payment rails in Go, TypeScript, and SQL. Open to 2026/2027 graduates.",
      postedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      dedupeHash: sha256("stripe-swe-intern-infra-2025"),
      status: "ACTIVE",
    },
  });

  const opening2 = await prisma.jobOpening.create({
    data: {
      sourceId: jobSource.id,
      canonicalUrl: "https://jobs.lever.co/demo/datadog-systems-intern",
      companyName: "Datadog",
      roleTitle: "Systems Software Engineer Intern",
      location: "Bengaluru, India",
      workMode: "HYBRID",
      roleType: "INTERN",
      description: "Work on high-throughput telemetry pipelines and agent collectors in Go and Python.",
      postedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      dedupeHash: sha256("datadog-systems-intern-2025"),
      status: "ACTIVE",
    },
  });

  // 7. Job Matches
  await prisma.jobMatch.create({
    data: {
      jobOpeningId: opening1.id,
      overallFitScore: 92.5,
      roleScore: 95.0,
      skillsScore: 90.0,
      eligibilityScore: 100.0,
      recencyScore: 95.0,
      matchedSkills: ["TypeScript", "SQL", "Git", "REST APIs", "DSA"],
      missingSkills: ["Go (Basic familiarity)"],
      rationale: "Strong alignment with backend architecture, data structures, and 2027 graduation timeline.",
    },
  });

  // 8. Job Applications
  await prisma.jobApplication.create({
    data: {
      userId: user.id,
      jobOpeningId: opening1.id,
      resumeVersionId: resumeVersion.id,
      stage: "SHORTLISTED",
      notes: "High priority role. Need to tailor resume emphasizing distributed systems concepts.",
    },
  });

  // 9. Recruiter Contact & Outreach Draft
  const recruiter = await prisma.recruiterContact.create({
    data: {
      jobOpeningId: opening1.id,
      fullName: "Ananya Sharma",
      companyName: "Stripe",
      title: "University Talent Lead - APAC",
      email: "ananya.recruiter.demo@stripe.example.com",
      provenanceUrl: "https://stripe.com/jobs/university",
      verificationState: "VERIFIED_PUBLIC",
      isDoNotContact: false,
    },
  });

  const draftBody = "Hi Ananya,\n\nI noticed Stripe's opening for the Infrastructure SWE Intern role. As a B.Tech student graduating in 2027 with experience building distributed projects like WaferOS and solving 87+ LeetCode problems, I would love to learn more about the team's engineering challenges.\n\nBest regards,\nBadri Vishal Pandey";

  const outreachDraft = await prisma.outreachDraft.create({
    data: {
      userId: user.id,
      contactId: recruiter.id,
      jobOpeningId: opening1.id,
      channel: "GMAIL",
      subject: "Stripe Infrastructure SWE Intern - Badri Vishal Pandey",
      bodyText: draftBody,
      dedupeKey: sha256(`stripe-ananya-${user.id}`),
      status: "NEEDS_REVIEW",
    },
  });

  // 10. Approval Request (Action Gate)
  await prisma.approvalRequest.create({
    data: {
      userId: user.id,
      actionType: "SEND_EMAIL",
      targetResourceId: outreachDraft.id,
      targetResourceName: "Outreach to Ananya Sharma (Stripe)",
      contentHash: sha256(draftBody),
      consequenceSummary: "Dispatches personalized email via Gmail API with attached tailored resume.",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes TTL
    },
  });

  // 11. LinkedIn Content Draft
  const postText = "Reflecting on open-source reproducibility: in semiconductor manufacturing, micro-defects cost millions. I recently published WaferOS, an open-source PyTorch pipeline for wafer defect classification.\n\nCheck out the GitHub repo and reproduction notebook below!\n\n#DeepLearning #OpenSource #PyTorch #ComputerVision";

  await prisma.linkedInContentDraft.create({
    data: {
      userId: user.id,
      topic: "WaferOS Open-Source Architecture",
      targetAudience: "Systems and ML Engineers",
      postContent: postText,
      hashtags: ["#DeepLearning", "#OpenSource", "#PyTorch", "#ComputerVision"],
      status: "DRAFT",
      approvalHash: sha256(postText),
      evidenceFacts: {
        connect: [{ id: fact1.id }],
      },
    },
  });

  // 12. GitHub Repository Watch & Issues
  const repoWatch = await prisma.repositoryWatch.create({
    data: {
      userId: user.id,
      repoFullName: "badrisatyam1-ctrl/wafer-defect-classification",
      repoUrl: "https://github.com/badrisatyam1-ctrl/wafer-defect-classification",
      isOwned: true,
      defaultBranch: "main",
      primaryLanguage: "Python",
      topics: ["deep-learning", "pytorch", "computer-vision", "semiconductor"],
      starsCount: 5,
      forksCount: 0,
      openIssuesCount: 2,
      licenseSpdx: "MIT",
      hasContributing: true,
      lastSyncedAt: new Date(),
    },
  });

  const issue1 = await prisma.issueCandidate.create({
    data: {
      repoWatchId: repoWatch.id,
      issueNumber: 3,
      issueUrl: "https://github.com/badrisatyam1-ctrl/wafer-defect-classification/issues/3",
      title: "Add batch inference benchmark and latency profiling",
      bodySummary: "Profile memory usage and per-wafer inference time under high throughput.",
      labels: ["enhancement", "good first issue"],
      suitabilityScore: 96.0,
      scoreRationale: "Direct match with own codebase, clear scope, isolated benchmark testable locally.",
      complexityEstimate: "LOW",
      isAssigned: false,
      status: "ACCEPTED",
    },
  });

  // 13. Contribution Task & Local Sandbox Run
  const contribTask = await prisma.contributionTask.create({
    data: {
      userId: user.id,
      repoWatchId: repoWatch.id,
      issueCandidateId: issue1.id,
      branchName: "feat/batch-inference-benchmark",
      contributionPlan: "1. Create benchmark.py script\n2. Add mock wafer generator\n3. Run pytest on throughput\n4. Generate report",
      patchDiff: "diff --git a/benchmark.py b/benchmark.py\nnew file mode 100644\n+def benchmark_batch(model, dataloader): pass",
      diffHash: sha256("fake-diff-benchmark"),
      status: "TESTS_PASSED",
    },
  });

  await prisma.sandboxRun.create({
    data: {
      contributionTaskId: contribTask.id,
      commandExecuted: "pytest tests/test_benchmark.py -v",
      exitCode: 0,
      stdoutSnippet: "test_benchmark_throughput PASSED [100%]\n3 passed in 0.42s",
      durationMs: 420,
    },
  });

  // 14. Skill Gap & Practice Session
  const skillGap = await prisma.skillGap.create({
    data: {
      userId: user.id,
      skillName: "Distributed Systems & Consensus",
      category: "SYSTEM_DESIGN",
      requirementLevel: "REQUIRED",
      currentMastery: "INTERMEDIATE",
      evidenceStatus: "PRACTICING",
      practicePlan: "Study Raft consensus algorithm and implement key-value store in Go.",
    },
  });

  await prisma.practiceSession.create({
    data: {
      skillGapId: skillGap.id,
      sessionType: "SYSTEM_DESIGN",
      notes: "Read Raft paper sections 1-5; implemented leader election state transitions.",
      durationMinutes: 90,
    },
  });

  // 15. Scheduled Task
  await prisma.scheduledTask.create({
    data: {
      userId: user.id,
      name: "Daily Job & Internship Sweep",
      cronExpression: "0 9 * * 1-5",
      taskType: "JOB_SWEEP",
      isEnabled: true,
      lastRunAt: new Date(Date.now() - 12 * 3600 * 1000),
      nextRunAt: new Date(Date.now() + 12 * 3600 * 1000),
    },
  });

  // 16. Audit Log
  await prisma.auditEvent.createMany({
    data: [
      {
        userId: user.id,
        actorType: "SYSTEM",
        moduleName: "AUTH",
        actionName: "DEMO_SEED_INITIALIZED",
        status: "SUCCESS",
        detailsRedacted: JSON.stringify({ message: "Demo environment initialized successfully" }),
      },
      {
        userId: user.id,
        actorType: "AGENT",
        moduleName: "APPROVAL",
        actionName: "APPROVAL_REQUEST_CREATED",
        targetResource: "Outreach to Ananya Sharma (Stripe)",
        status: "SUCCESS",
        detailsRedacted: JSON.stringify({ actionType: "SEND_EMAIL", ttlMinutes: 30 }),
      },
    ],
  });

  // 17. Notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Outreach Draft Requires Approval",
      message: "Personalized outreach to Ananya Sharma (Stripe) is drafted and waiting for your review.",
      type: "APPROVAL_REQUIRED",
      isRead: false,
      linkUrl: "/network",
    },
  });

  console.log("✅ CareerOS Demo Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
