"use client";

import { useState } from "react";
import {
  BookOpen,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Layers,
  Award,
  Calendar,
  Clock,
  HelpCircle,
  ShieldCheck,
  Star,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  FileCheck2,
  Lock,
} from "lucide-react";
import { InterviewPrepService } from "@/modules/interview/service";
import { CareerEvidenceVaultService } from "@/modules/vault/service";
import { JobDiscoveryService } from "@/modules/jobs/service";

export default function InterviewPrepPage() {
  const interviewService = new InterviewPrepService();
  const vaultService = new CareerEvidenceVaultService();
  const jobService = new JobDiscoveryService();

  const scoredJobs = jobService.getScoredJobs();
  const [selectedJobId, setSelectedJobId] = useState<string>("job-stripe-infra-2025");
  const selectedJob = scoredJobs.find((j) => j.job.id === selectedJobId)?.job || scoredJobs[0].job;

  const skillMatrix = interviewService.deriveSkillMatrix(selectedJob);
  const studyPlan = interviewService.getStudyPlan(selectedJob.id);
  const questions = interviewService.getInterviewQuestions(selectedJob.id);
  const starStories = interviewService.getStarStories();
  const facts = vaultService.getAllFacts();

  const [activeTab, setActiveTab] = useState<
    "matrix" | "study_plan" | "questions" | "star_stories" | "vault"
  >("matrix");

  // Interactive Claim Verifier
  const [testClaim, setTestClaim] = useState<string>("Implemented WaferOS PyTorch model for wafer defect classification");
  const [claimVerification, setClaimVerification] = useState(vaultService.verifyClaim(testClaim));

  const handleTestClaim = (text: string) => {
    setTestClaim(text);
    setClaimVerification(vaultService.verifyClaim(text));
  };

  // Practice session logging state
  const [practiceSkill, setPracticeSkill] = useState<string>("Distributed Systems & Redis Lease Locks");
  const [practiceDuration, setPracticeDuration] = useState<number>(60);
  const [practiceRating, setPracticeRating] = useState<number>(4);
  const [practiceNotes, setPracticeNotes] = useState<string>("");
  const [practiceLogged, setPracticeLogged] = useState<boolean>(false);
  const [sessions, setSessions] = useState(interviewService.getPracticeSessions());

  const handleLogPractice = async () => {
    if (!practiceNotes) return;
    const newSession = await interviewService.recordPracticeSession("demo-user-badri", {
      skillName: practiceSkill,
      sessionType: "SYSTEM_DESIGN",
      notes: practiceNotes,
      durationMinutes: practiceDuration,
      confidenceRating: practiceRating,
    });
    setSessions([newSession, ...sessions]);
    setPracticeNotes("");
    setPracticeLogged(true);
    setTimeout(() => setPracticeLogged(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-600" />
            Interview Preparation & Career Memory Vault
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Skill matrices derived from shortlisted jobs and STAR stories grounded strictly in verified project artifacts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-mono border border-teal-200 flex items-center gap-1.5 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            107-Day DSA Streak Active (87 Solved)
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200 font-medium">
            Vault: 6 Verified Evidence Facts
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "matrix", label: "Job Skill Matrix" },
          { id: "study_plan", label: "4-Week Study Plan" },
          { id: "questions", label: "Interview Questions" },
          { id: "star_stories", label: "Verified STAR Stories" },
          { id: "vault", label: "Career Evidence Vault" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === tab.id
                ? "bg-teal-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Job Skill Matrix */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          {/* Target Role Selector */}
          <div className="p-4 rounded-xl omni-card border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Select Target Shortlisted Role:</span>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-xs text-slate-900 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-600 font-medium"
              >
                {scoredJobs.map((j) => (
                  <option key={j.job.id} value={j.job.id}>
                    {j.job.companyName} — {j.job.roleTitle}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-500">Required: <strong className="text-slate-900 font-bold">{skillMatrix.summary.requiredCount}</strong></span>
              <span className="text-emerald-700">Demonstrated: <strong className="text-slate-900 font-bold">{skillMatrix.summary.demonstratedCount}</strong></span>
              <span className="text-amber-700">Gaps to Study: <strong className="text-slate-900 font-bold">{skillMatrix.summary.gapCount}</strong></span>
            </div>
          </div>

          {/* Skill Matrix Grid */}
          <div className="omni-card border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Derived Competency Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Resume keywords alone are NOT treated as proof. Every demonstrated skill links to concrete code artifacts.
                </p>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {skillMatrix.entries.map((entry, idx) => {
                const isDemonstrated = entry.level === "DEMONSTRATED_BY_PROJECT";
                const isPartial = entry.level === "PARTIALLY_DEMONSTRATED";

                return (
                  <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{entry.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-100 text-slate-700 border border-slate-200">
                          {entry.requirementType}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            isDemonstrated
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : isPartial
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {entry.level.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{entry.reason}</p>
                    </div>
                    {entry.evidenceRef && (
                      <div className="shrink-0">
                        <span className="text-xs font-mono px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                          Evidence: {entry.evidenceRef}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 4-Week Study Plan */}
      {activeTab === "study_plan" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studyPlan.map((milestone) => (
              <div
                key={milestone.weekNumber}
                className={`omni-card border rounded-2xl p-6 space-y-4 shadow-sm ${
                  milestone.isCompleted ? "border-teal-300 ring-1 ring-teal-200/50" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700">
                    Week {milestone.weekNumber} • {milestone.focusArea}
                  </span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded font-semibold font-mono ${
                      milestone.isCompleted
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {milestone.isCompleted ? "COMPLETED ✓" : "IN PROGRESS"}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{milestone.title}</h3>
                <div className="space-y-2">
                  {milestone.tasks.map((task, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{task}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Practice Session Logger */}
          <div className="omni-card border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-teal-600" />
              Log Practice Session & Rate Confidence
            </h3>
            {practiceLogged && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Practice session recorded! Confidence ratings updated.</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Focus Skill:</label>
                <input
                  type="text"
                  value={practiceSkill}
                  onChange={(e) => setPracticeSkill(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Duration (minutes):</label>
                <input
                  type="number"
                  value={practiceDuration}
                  onChange={(e) => setPracticeDuration(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Confidence Rating (1 to 5):</label>
                <select
                  value={practiceRating}
                  onChange={(e) => setPracticeRating(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-teal-600"
                >
                  <option value={1}>1 - Needs Significant Work</option>
                  <option value={2}>2 - Basic Familiarity</option>
                  <option value={3}>3 - Moderate (Review Needed)</option>
                  <option value={4}>4 - Confident</option>
                  <option value={5}>5 - Interview Ready</option>
                </select>
              </div>
            </div>
            <div className="text-xs">
              <label className="text-slate-600 font-semibold block mb-1">Session Notes & Problems Covered:</label>
              <textarea
                rows={3}
                value={practiceNotes}
                onChange={(e) => setPracticeNotes(e.target.value)}
                placeholder="e.g. Solved LeetCode Daily Temperatures with monotonic stack; analyzed amortized O(N) complexity..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-teal-600"
              />
            </div>
            <button
              type="button"
              onClick={handleLogPractice}
              className="px-5 py-2.5 rounded-xl omni-btn-primary text-xs font-semibold shadow-sm"
            >
              Record Practice
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Interview Questions */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="omni-card border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-teal-700">
                  {q.category.replace(/_/g, " ")} {q.contextProject && `• ${q.contextProject}`}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                  Technical Defense
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{q.prompt}</h3>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <span className="font-semibold text-teal-800 uppercase text-[10px] tracking-wider block">
                  Key Architectural Points to Hit
                </span>
                <div className="space-y-1">
                  {q.keyPointsToHit.map((point, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-700">
                      <span className="text-teal-600 font-bold">✓</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Verified STAR Stories */}
      {activeTab === "star_stories" && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl omni-card border border-slate-200 flex items-center gap-3 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
            <p className="text-xs text-slate-600">
              All STAR stories are grounded strictly in verified code repositories and LeetCode activity. Zero invented anecdotes or exaggerated production metrics.
            </p>
          </div>
          <div className="space-y-5">
            {starStories.map((story) => (
              <div key={story.id} className="omni-card border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-700">
                      {story.targetCompetency}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{story.title}</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-600 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-semibold">
                    Source: {story.verifiedEvidenceRef}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-teal-700 uppercase block">Situation</span>
                    <p className="text-slate-700 leading-relaxed">{story.situation}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-teal-700 uppercase block">Task</span>
                    <p className="text-slate-700 leading-relaxed">{story.task}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200 space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold text-teal-800 uppercase block">Action Taken</span>
                    <p className="text-slate-800 leading-relaxed">{story.action}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1 sm:col-span-2">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Outcome & Result</span>
                    <p className="text-slate-800 leading-relaxed">{story.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Career Evidence Vault */}
      {activeTab === "vault" && (
        <div className="space-y-6">
          {/* Claim Verifier Interactive Tool */}
          <div className="omni-card border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-teal-600" />
                  Evidence Vault Claim Verifier
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Test any claim to see how CareerOS validates or rejects it against the vault before writing.
                </p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded font-semibold font-mono ${
                  claimVerification.isSupported
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {claimVerification.isSupported ? "SUPPORTED BY VAULT ✓" : "UNSUPPORTED (REJECTED)"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="text-slate-500 self-center font-medium">Try sample claims:</span>
              <button
                type="button"
                onClick={() => handleTestClaim("Implemented WaferOS PyTorch model for wafer defect classification")}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                WaferOS PyTorch CNN
              </button>
              <button
                type="button"
                onClick={() => handleTestClaim("Engineered TravelBooking Redis concurrency lease locks")}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                TravelBooking Redis Locks
              </button>
              <button
                type="button"
                onClick={() => handleTestClaim("AWS Certified Solutions Architect with 5 years production experience")}
                className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 shadow-xs"
              >
                Unverified AWS Cert (Scam Test)
              </button>
            </div>

            <input
              type="text"
              value={testClaim}
              onChange={(e) => handleTestClaim(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-teal-600 font-mono"
            />

            {!claimVerification.isSupported && (
              <p className="text-xs text-rose-600 italic">
                {claimVerification.missingEvidenceMessage}
              </p>
            )}
          </div>

          {/* Facts List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Verified Career Facts in Vault</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {facts.map((fact) => (
                <div key={fact.id} className="omni-card border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                      {fact.factType}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      {fact.confidenceLevel} CONFIDENCE
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{fact.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{fact.claimSummary}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Source: {fact.sourceLocator || fact.sourceType}</span>
                    {fact.sourceUrl && (
                      <a
                        href={fact.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 hover:text-teal-800 hover:underline flex items-center gap-1 font-mono font-medium"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
