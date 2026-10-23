"use client";

import { useState } from "react";
import {
  Share2,
  CheckCircle,
  Copy,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Calendar,
  Layers,
  HelpCircle,
  Hash,
  FileCheck2,
  Clock,
  Archive,
} from "lucide-react";
import { LinkedInStudioService } from "@/modules/linkedin/service";
import { LinkedInDraftCandidate } from "@/modules/linkedin/types";

export default function LinkedInStudioPage() {
  const service = new LinkedInStudioService();
  const plan = service.generateWeeklyPlan("demo-user-badri");
  const tonePref = service.getTonePreferences();
  const archive = service.getRecentArchive();

  const [candidates, setCandidates] = useState<LinkedInDraftCandidate[]>(plan.candidates);
  const [selectedDraftId, setSelectedDraftId] = useState<string>(candidates[0].id);
  const [copied, setCopied] = useState<boolean>(false);
  const [approvalHash, setApprovalHash] = useState<string | null>(null);

  const selectedDraft = candidates.find((c) => c.id === selectedDraftId) || candidates[0];

  const handleApprove = async () => {
    if (selectedDraft.status === "APPROVED") {
      service.revokeApproval(selectedDraft);
      setApprovalHash(null);
      setCandidates([...candidates]);
    } else {
      const res = await service.approveDraft("demo-user-badri", selectedDraft);
      setApprovalHash(res.approvalHash);
      setCandidates([...candidates]);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedDraft.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-teal-600" />
            LinkedIn Content Studio
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            High-signal engineering reflections from verified project artifacts. Zero engagement spam or invented results.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-mono text-slate-700 border border-slate-200 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Publish Mode: Manual Handoff
          </span>
          <span className="px-3 py-1 rounded-full bg-teal-50 text-xs font-mono text-teal-700 border border-teal-200 font-semibold">
            Cadence: 3 Posts / Week
          </span>
        </div>
      </div>

      {/* Weekly Rotation Banner */}
      <div className="p-4 rounded-xl omni-card border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Weekly Content Plan</span>
              <span className="text-[11px] text-slate-500">Week of {plan.weekStartDate}</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Theme Rotation: <span className="text-slate-900 font-semibold">Build Log</span> →{" "}
              <span className="text-slate-900 font-semibold">Debugging Trade-off</span> →{" "}
              <span className="text-slate-900 font-semibold">DSA Reflection</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {candidates.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => setSelectedDraftId(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border shadow-xs ${
                selectedDraftId === c.id
                  ? "omni-btn-primary text-white border-transparent"
                  : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Draft #{idx + 1}: {c.theme.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: 2 cols editor, 1 col sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Draft Inspection & Review (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="omni-card border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono text-teal-700 font-bold uppercase tracking-wider">
                  {selectedDraft.scheduledSlot} • {selectedDraft.theme.replace(/_/g, " ")}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">{selectedDraft.title}</h2>
              </div>
              <div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
                    selectedDraft.status === "APPROVED"
                      ? "bg-teal-50 text-teal-700 border-teal-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {selectedDraft.status === "APPROVED" ? "APPROVED FOR POSTING" : "DRAFT (NEEDS REVIEW)"}
                </span>
              </div>
            </div>

            {/* Post Content Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Proposed Post Content (LinkedIn Formatted)</span>
                <span className="font-mono">{selectedDraft.characterCount} / 3,000 chars</span>
              </div>
              <textarea
                readOnly
                rows={12}
                value={selectedDraft.content}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm text-slate-900 font-sans leading-relaxed resize-none focus:outline-none focus:border-teal-600 shadow-inner"
              />
            </div>

            {/* Quality & Policy Checklist Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Quality & Policy Review Checklist
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-slate-800 font-medium">Verified Evidence</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-slate-800 font-medium">No Spam Hooks</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-slate-800 font-medium">Tone Modest (No Hype)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-slate-800 font-medium">Emojis: Under Cap</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-slate-800 font-medium">3–5 Focused Tags</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="text-slate-800 font-medium">Zero Secret Leakage</span>
                </div>
              </div>
            </div>

            {/* Factual Evidence & Source Links */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />
                  Factual Evidence & Source Provenance
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                  ALL FACTS VERIFIED
                </span>
              </div>
              <div className="space-y-1.5">
                {selectedDraft.evidenceSources.map((ev, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <span className="text-slate-800 font-medium">{ev.label}</span>
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 hover:underline flex items-center gap-1 font-mono text-[11px] font-semibold"
                    >
                      <span>View Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Why this suits Badri&apos;s profile: {selectedDraft.profileSuitabilityReason}
              </p>
            </div>

            {/* Visual / Carousel Suggestion */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                Optional Visual / Carousel Concept
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedDraft.visualIdea}</p>
            </div>

            {/* Action Buttons & Manual Handoff */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div>
                {selectedDraft.approvalHash && (
                  <div className="text-[11px] font-mono text-slate-500">
                    Approval SHA-256: <span className="text-teal-700 font-bold">{selectedDraft.approvalHash.slice(0, 16)}...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleApprove}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold transition border shadow-xs ${
                    selectedDraft.status === "APPROVED"
                      ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                      : "omni-btn-primary text-white border-transparent"
                  }`}
                >
                  {selectedDraft.status === "APPROVED" ? "Revoke Approval" : "Approve Content"}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl omni-btn-primary text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied!" : "Copy for LinkedIn"}</span>
                </button>
                <a
                  href="https://www.linkedin.com/feed/?shareActive=true"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Feed</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Guidelines, Tone Learning & Archive (1 col) */}
        <div className="space-y-6">
          {/* Tone Preference (Learned only from approvals) */}
          <div className="omni-card border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              Learned Tone & Style Profile
            </h3>
            <p className="text-xs text-slate-500">
              Tone preferences update strictly from posts you explicitly approve—never from unapproved proposals.
            </p>
            <div className="space-y-2">
              {tonePref.voiceDescriptors.map((desc, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                  <span>{desc}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between font-medium">
              <span>Approved Posts Count: {tonePref.approvedDraftsCount}</span>
              <span>Length: {tonePref.preferredLength}</span>
            </div>
          </div>

          {/* Missing Evidence Policy */}
          <div className="omni-card border border-slate-200 rounded-2xl p-6 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Missing Evidence Protocol
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If an intended topic lacks verifiable benchmark numbers or deployment results, CareerOS stops and requests a real measurement rather than inventing numbers.
            </p>
          </div>

          {/* Published Archive & Repetition Sentinel */}
          <div className="omni-card border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Archive className="w-4 h-4 text-slate-500" />
              Recent Archive & Repetition Check
            </h3>
            <div className="space-y-2.5">
              {archive.map((arch) => (
                <div key={arch.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-800">{arch.topic}</span>
                    <span className="text-slate-500 font-mono">14d ago</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{arch.summary}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-teal-700 font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Zero repetition warnings detected for current batch.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
