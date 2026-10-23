"use client";

import { useState } from "react";
import {
  Briefcase,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Filter,
  FileText,
  Mail,
  ShieldAlert,
  ChevronDown,
  X,
  Copy,
  Download,
  AlertCircle,
  Layers,
  Award,
} from "lucide-react";
import Link from "next/link";
import { JobDiscoveryService } from "@/modules/jobs/service";
import { ResumeTailoringService } from "@/modules/resume/service";
import { JobOpeningItem, ApplicationStage } from "@/modules/jobs/types";
import { TailoredResumeVariant } from "@/modules/resume/types";

export default function JobsPage() {
  const [jobService] = useState(() => new JobDiscoveryService());
  const [resumeService] = useState(() => new ResumeTailoringService());

  const [filterRoleType, setFilterRoleType] = useState<string>("ALL");
  const [filterWorkMode, setFilterWorkMode] = useState<string>("ALL");
  const [filterEligibilityOnly, setFilterEligibilityOnly] = useState<boolean>(false);
  const [filterPaidOnly, setFilterPaidOnly] = useState<boolean>(false);
  const [filterStage, setFilterStage] = useState<string>("ALL");

  const [activeResumeModalJob, setActiveResumeModalJob] = useState<JobOpeningItem | null>(null);
  const [tailoredResume, setTailoredResume] = useState<TailoredResumeVariant | null>(null);
  const [resumeCopied, setResumeCopied] = useState<boolean>(false);

  const scoredJobs = jobService.getScoredJobs({
    roleType: filterRoleType as any,
    workMode: filterWorkMode as any,
    eligibilityOnly: filterEligibilityOnly,
    paidOnly: filterPaidOnly,
    stage: filterStage as any,
  });

  const handleStageChange = async (jobId: string, newStage: ApplicationStage) => {
    await jobService.updateJobStage("demo-user-badri", jobId, newStage);
  };

  const handleOpenResumeTailor = (job: JobOpeningItem) => {
    const variant = resumeService.tailorResumeForJob(job, 2028); // 2028 is LinkedIn year to trigger mismatch notice
    setTailoredResume(variant);
    setActiveResumeModalJob(job);
  };

  const handleApproveResume = async () => {
    if (!tailoredResume) return;
    const res = await resumeService.approveResumeVariant("demo-user-badri", tailoredResume);
    setTailoredResume({ ...tailoredResume, isApproved: true, approvalHash: res.approvalHash });
  };

  const handleCopyResume = () => {
    if (!tailoredResume) return;
    navigator.clipboard.writeText(tailoredResume.markdownContent);
    setResumeCopied(true);
    setTimeout(() => setResumeCopied(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-teal-600" />
            Jobs & Internships Radar
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Scored against confirmed qualifications and 2028 graduation timeline (GCET 3rd Year ECE). Zero unauthorized scraping or auto-applying.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-mono text-slate-700 border border-slate-200 font-medium">
            Sources: Greenhouse • Lever • Company ATS
          </span>
          <span className="px-3 py-1 rounded-full bg-teal-50 text-xs font-mono text-teal-700 border border-teal-200 font-semibold">
            Active Feed: 5 Curated Listings
          </span>
        </div>
      </div>

      {/* Confirmed Graduation Date Banner */}
      <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 flex items-start gap-3 shadow-xs">
        <CheckCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-teal-900 text-sm">
            Graduation Timeline Verified: Class of 2028
          </p>
          <p className="text-slate-600 leading-relaxed">
            Confirmed profile: <span className="font-bold text-slate-900">2028 Batch</span> (3rd Year B.Tech in Electronics & Communication Engineering at GCET). All job qualification match algorithms are calibrated for 2028 internship and early graduate eligibility.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">Role:</span>
            <select
              value={filterRoleType}
              onChange={(e) => setFilterRoleType(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Types</option>
              <option value="INTERN">Internships</option>
              <option value="FULL_TIME">Full-Time</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">Work Mode:</span>
            <select
              value={filterWorkMode}
              onChange={(e) => setFilterWorkMode(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Modes</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ON_SITE">On-Site</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 font-medium">Stage:</span>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Stages</option>
              <option value="DISCOVERED">Discovered</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="APPLIED">Applied</option>
              <option value="INTERVIEW">Interview</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterEligibilityOnly}
              onChange={(e) => setFilterEligibilityOnly(e.target.checked)}
              className="rounded bg-white border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span>Eligible Only (No Blockers)</span>
          </label>

          <label className="flex items-center gap-1.5 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterPaidOnly}
              onChange={(e) => setFilterPaidOnly(e.target.checked)}
              className="rounded bg-white border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span>Paid Roles Only</span>
          </label>
        </div>

        <div className="text-slate-500 font-mono">
          Showing {scoredJobs.length} listings
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="space-y-5">
        {scoredJobs.map(({ job, match, stage }) => {
          const hasBlockers = match.hardBlockers.length > 0;

          return (
            <div
              key={job.id}
              className={`bg-white border rounded-2xl p-6 transition-all space-y-4 shadow-sm hover:shadow-md ${
                hasBlockers
                  ? "border-rose-300/80 bg-rose-50/20"
                  : "border-slate-200 hover:border-teal-400"
              }`}
            >
              {/* Header: Company, Role, Location, Stipend, Score */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">{job.companyName}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {job.workMode}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {job.roleType}
                    </span>
                    {job.salaryOrStipend && (
                      <span className="text-xs px-2.5 py-0.5 rounded font-mono font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        {job.salaryOrStipend}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-500">
                      via {job.sourcePlatform.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mt-1">{job.roleTitle}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{job.location}</p>
                </div>

                {/* Score Pill & Controls */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Sparkles
                        className={`w-4 h-4 ${
                          hasBlockers ? "text-rose-500" : "text-teal-600"
                        }`}
                      />
                      <span
                        className={`text-xl font-extrabold font-mono ${
                          hasBlockers ? "text-rose-600" : "text-teal-700"
                        }`}
                      >
                        {match.overallFitScore}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {hasBlockers ? "Blocked" : "Explainable Fit"}
                    </span>
                  </div>

                  <select
                    value={stage}
                    onChange={(e) => handleStageChange(job.id, e.target.value as ApplicationStage)}
                    className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 shadow-xs"
                  >
                    <option value="DISCOVERED">Discovered</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="DRAFTING">Drafting</option>
                    <option value="APPROVED">Approved</option>
                    <option value="APPLIED">Applied</option>
                    <option value="INTERVIEW">Interview</option>
                    <option value="REJECTED">Rejected</option>
                  </select>

                  <a
                    href={job.canonicalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200 shadow-xs"
                    title="View Official Job Listing"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Hard Blocker Alert (if any) */}
              {hasBlockers && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Hard Blocker: </span>
                    {match.hardBlockers.join("; ")}
                  </div>
                </div>
              )}

              {/* Score Breakdown Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Skills</span>
                  <span className="font-mono font-bold text-slate-800">{match.breakdown.skillOverlap}/30</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Role Fit</span>
                  <span className="font-mono font-bold text-slate-800">{match.breakdown.roleAlignment}/25</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Projects</span>
                  <span className="font-mono font-bold text-slate-800">{match.breakdown.projectEvidence}/20</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Eligibility</span>
                  <span className={`font-mono font-bold ${match.breakdown.eligibilityScore > 0 ? "text-teal-700" : "text-rose-600"}`}>
                    {match.breakdown.eligibilityScore}/15
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Location</span>
                  <span className="font-mono font-bold text-slate-800">{match.breakdown.locationFit}/10</span>
                </div>
              </div>

              {/* Rationale & Skills Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="md:col-span-1 space-y-1">
                  <span className="text-slate-700 font-semibold">Fit Rationale:</span>
                  <p className="text-slate-600 leading-relaxed">{match.rationale}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-teal-700 font-semibold">Verified Matched Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {match.matchedSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[11px] border border-teal-200 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-amber-800 font-semibold">Skill Gaps to Address:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {match.softSkillGaps.length > 0 ? (
                      match.softSkillGaps.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] border border-amber-200 font-medium">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-[11px]">No skill gaps identified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Tailor Resume & Outreach */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-500">
                  {match.matchingProjects.length > 0 && (
                    <span>Backed by: {match.matchingProjects.join(" • ")}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {!hasBlockers && (
                    <button
                      type="button"
                      onClick={() => handleOpenResumeTailor(job)}
                      className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Tailor Truthful Resume</span>
                    </button>
                  )}
                  {job.recruiterEmail && (
                    <Link
                      href="/outreach"
                      className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-600" />
                      <span>Request Outreach</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Truthful Resume Tailoring Modal */}
      {activeResumeModalJob && tailoredResume && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <h2 className="text-lg font-bold text-slate-900">
                    Truthful Tailored Resume: {activeResumeModalJob.companyName}
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                    ZERO FABRICATION GUARANTEED
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Base resume is immutable. Emphasizes verified evidence matching {activeResumeModalJob.roleTitle}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveResumeModalJob(null)}
                className="text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Graduation discrepancy warning */}
              {tailoredResume.graduationMismatchFlag && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>{tailoredResume.graduationMismatchFlag}</div>
                </div>
              )}

              {/* Changed Bullets & Ordering Explanation */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Project Prioritization & Tailoring Diff
                </span>
                <div className="space-y-2">
                  {tailoredResume.changedBullets.map((b, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-teal-700">{b.section}</span>
                        <span className="font-mono text-[10px] text-slate-500">{b.evidenceRef}</span>
                      </div>
                      <p className="text-slate-800 font-medium">{b.tailoredBullet}</p>
                      <p className="text-[11px] text-slate-500 italic">Rationale: {b.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills breakdown: Highlighted vs Omitted Gaps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="font-bold text-teal-800 block text-[11px] uppercase">
                    Highlighted Verified Skills
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tailoredResume.matchedSkillsHighlighted.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[11px] border border-teal-200 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-700 block text-[11px] uppercase">
                    JD Requirements Omitted (Not in Vault)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tailoredResume.skillGapsOmitted.length > 0 ? (
                      tailoredResume.skillGapsOmitted.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] border border-slate-200">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-[11px]">All required skills verified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Markdown Preview */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Generated Markdown Representation
                </span>
                <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-100 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 shadow-inner">
                  {tailoredResume.markdownContent}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                {tailoredResume.approvalHash && (
                  <span className="text-[11px] font-mono text-teal-700 font-semibold">
                    Approved SHA-256: {tailoredResume.approvalHash.slice(0, 16)}...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopyResume}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition flex items-center gap-1.5 shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{resumeCopied ? "Copied!" : "Copy Markdown"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleApproveResume}
                  className={`px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    tailoredResume.isApproved
                      ? "bg-slate-100 text-slate-500 border border-slate-300"
                      : "bg-teal-600 hover:bg-teal-500 text-white shadow-sm"
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{tailoredResume.isApproved ? "Approved ✓" : "Approve Tailored Resume"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
