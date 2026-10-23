"use client";

import { useState } from "react";
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  ExternalLink,
  FileText,
  Clock,
  Ban,
  Lock,
  Layers,
  Sparkles,
  Paperclip,
  Check,
} from "lucide-react";
import { GmailOutreachService } from "@/modules/outreach/service";
import { MockGmailAdapter } from "@/integrations/gmail";
import { OutreachMessageDraft } from "@/modules/outreach/types";

export default function OutreachPage() {
  const [service] = useState(() => {
    const adapter = new MockGmailAdapter();
    adapter.sendCapabilityGranted = true; // Enabled for approved simulation
    return new GmailOutreachService(adapter);
  });

  const [drafts, setDrafts] = useState<OutreachMessageDraft[]>(() => service.getDrafts());
  const [selectedDraftId, setSelectedDraftId] = useState<string>("outreach-stripe-001");
  const [approvalHash, setApprovalHash] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedDraft = drafts.find((d) => d.id === selectedDraftId) || drafts[0];
  const limits = service.getLimits();
  const followUpCheck = service.evaluateFollowUpEligibility(selectedDraft.id);

  const handleApprove = async () => {
    setErrorMsg(null);
    try {
      const res = await service.requestSendApproval("demo-user-badri", selectedDraft.id);
      setApprovalHash(res.contentHash);
      setDrafts([...service.getDrafts()]);
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleSend = async () => {
    if (!selectedDraft.approvalId || !selectedDraft.contentHash) return;
    setErrorMsg(null);
    const res = await service.sendApprovedOutreach(
      "demo-user-badri",
      selectedDraft.id,
      selectedDraft.approvalId,
      selectedDraft.contentHash
    );

    if (res.success) {
      setSendResult(`Dispatched successfully! Gmail Message ID: ${res.messageId}`);
      setDrafts([...service.getDrafts()]);
    } else {
      setErrorMsg(res.error || "Failed to dispatch email.");
    }
  };

  const handleCreateFollowUp = () => {
    setErrorMsg(null);
    try {
      const newDraft = service.prepareFollowUpDraft(selectedDraft.id);
      setDrafts([...service.getDrafts()]);
      setSelectedDraftId(newDraft.id);
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleDoNotContact = () => {
    service.setDoNotContact(selectedDraft.recipient.email, "User requested exclusion");
    setDrafts([...service.getDrafts()]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Limits Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-teal-600" />
            Email Outreach & Gmail Approval Gate
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            One-to-one recruiter outreach via official Gmail API. Every single message requires an explicit approval token.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-mono text-slate-700 border border-slate-200 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Daily Cap: {limits.dailySentCount}/{limits.dailySendLimit} Sent
          </span>
          <span className="px-3 py-1 rounded-full bg-teal-50 text-xs font-mono text-teal-700 border border-teal-200 font-semibold">
            Weekly: {limits.weeklySentCount}/{limits.weeklySendLimit} Sent
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-mono text-slate-700 border border-slate-200">
            Mode: One-to-One Draft-First
          </span>
        </div>
      </div>

      {/* Select Active Draft Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {drafts.map((d) => (
          <button
            key={d.id}
            onClick={() => {
              setSelectedDraftId(d.id);
              setErrorMsg(null);
              setSendResult(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
              selectedDraftId === d.id
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            {d.companyName}: {d.recipient.fullName.split(" ")[0]} ({d.status.replace(/_/g, " ")})
          </button>
        ))}
      </div>

      {/* Error / Success Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {sendResult && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{sendResult}</span>
        </div>
      )}

      {/* Unified Preview & Approval Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Outreach Card (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="omni-card rounded-2xl p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono uppercase text-teal-700 font-semibold tracking-wider">
                  Draft ID: {selectedDraft.id}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  To: {selectedDraft.recipient.fullName} ({selectedDraft.recipient.title})
                </h2>
                <p className="text-xs text-slate-500">
                  Target Role: <span className="text-slate-800 font-semibold">{selectedDraft.jobTitle} @ {selectedDraft.companyName}</span>
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedDraft.status === "SENT"
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : selectedDraft.status === "APPROVED"
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : selectedDraft.status === "BLOCKED"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {selectedDraft.status.replace(/_/g, " ")}
              </span>
            </div>

            {/* Recruiter Details & Source Provenance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Recipient Email:</span>
                <p className="text-slate-900 font-mono font-medium mt-0.5">{selectedDraft.recipient.email}</p>
              </div>
              <div>
                <span className="text-slate-500 block">Subject Line:</span>
                <p className="text-slate-900 font-medium mt-0.5">{selectedDraft.subject}</p>
              </div>
              <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span>Verified Public Source:</span>
                  <a
                    href={selectedDraft.recipient.provenanceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 hover:underline flex items-center gap-0.5 font-mono font-semibold"
                  >
                    <span>{selectedDraft.recipient.provenanceUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                  SOURCE VERIFIED
                </span>
              </div>
            </div>

            {/* Resume Attachment Preview */}
            {selectedDraft.attachment && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-900 font-semibold block">{selectedDraft.attachment.fileName}</span>
                    <span className="text-slate-500 text-[11px] font-mono">
                      ~184 KB • SHA-256: {selectedDraft.attachment.checksumSha256.slice(0, 16)}...
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                  Attached from Settings
                </span>
              </div>
            )}

            {/* Message Body */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Message Body Preview:</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-800 font-sans whitespace-pre-wrap leading-relaxed shadow-xs">
                {selectedDraft.bodyText}
              </div>
            </div>

            {/* Consequential Action Approval Gate (§6) */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-900">Security Rule §6: Consequential Action Gate</p>
                <p className="text-slate-600 leading-relaxed">
                  Sending an email transmits an external communication under your name. Approving locks the SHA-256 content hash to prevent modification prior to dispatch.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div>
                {selectedDraft.contentHash && (
                  <span className="text-[11px] font-mono text-slate-500">
                    Content SHA-256: <span className="text-teal-700 font-semibold">{selectedDraft.contentHash.slice(0, 16)}...</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {selectedDraft.status !== "SENT" && selectedDraft.status !== "BLOCKED" && (
                  <>
                    <button
                      type="button"
                      onClick={handleDoNotContact}
                      className="px-3 py-2 rounded-lg text-slate-500 hover:text-rose-600 text-xs transition border border-slate-200 bg-white hover:border-rose-300 shadow-xs"
                      title="Mark Recruiter as Do Not Contact"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                    {selectedDraft.status !== "APPROVED" ? (
                      <button
                        type="button"
                        onClick={handleApprove}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Email Content</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSend}
                        className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                      >
                        <Send className="w-4 h-4" />
                        <span>Dispatch via Gmail API</span>
                      </button>
                    )}
                  </>
                )}
                {selectedDraft.status === "SENT" && (
                  <span className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dispatched on {new Date(selectedDraft.sentAt!).toLocaleDateString()}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Follow-Up Rules & Audit Safeguards (1 col) */}
        <div className="space-y-6">
          {/* Follow-up Rules Engine Card */}
          <div className="omni-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              Follow-Up Rules Engine
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Polite follow-ups are permissible only when strictly meeting anti-spam criteria:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Interval Minimum:</span>
                <span className="text-slate-800 font-mono font-semibold">≥ 7 Days</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Max Follow-ups:</span>
                <span className="text-slate-800 font-mono font-semibold">1 Follow-up Max</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Current Eligibility:</span>
                <span
                  className={`font-semibold ${
                    followUpCheck.isEligible ? "text-teal-700" : "text-slate-500"
                  }`}
                >
                  {followUpCheck.isEligible ? "Eligible" : "Not Met"}
                </span>
              </div>
            </div>

            {selectedDraft.status === "SENT" && followUpCheck.isEligible && (
              <button
                type="button"
                onClick={handleCreateFollowUp}
                className="w-full px-4 py-2 rounded-xl omni-btn-primary text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Prepare Polite Follow-Up</span>
              </button>
            )}

            {followUpCheck.reasons.length > 0 && selectedDraft.status !== "SENT" && (
              <p className="text-[11px] text-slate-500 italic">
                {followUpCheck.reasons[0]}
              </p>
            )}
          </div>

          {/* Privacy & Redaction Policy */}
          <div className="omni-card rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600" />
              Audit Privacy & Redaction
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Logs record only Gmail message IDs, timestamps, recipient domains, and attachment checksums. Message bodies and private recruiter PII are never persisted to application logs or version control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
