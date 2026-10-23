"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Ban,
  Award,
  Clock,
  Calendar,
  Edit3,
  Trash2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  X,
  BookOpen,
  Send,
  SlidersHorizontal,
  Cpu,
  Layers,
  CheckCheck,
} from "lucide-react";
import { NetworkLeadItem, LeadCategory, RelationshipState, AntiSpamStatus } from "@/modules/networking/types";

export default function NetworkPage() {
  const [leads, setLeads] = useState<NetworkLeadItem[]>([]);
  const [antiSpam, setAntiSpam] = useState<AntiSpamStatus>({
    dailyDraftCount: 0,
    dailyCap: 5,
    isDailyCapReached: false,
    recentContactsCount: 0,
    doNotContactCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [domainFilter, setDomainFilter] = useState<string>("ALL");

  // Interaction feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<NetworkLeadItem | null>(null);

  // Form State for Adding Contact
  const [addForm, setAddForm] = useState({
    fullName: "",
    roleTitle: "",
    company: "",
    category: "ENGINEER_MAINTAINER" as LeadCategory,
    profileUrl: "",
    provenanceUrl: "",
    domainFocus: "",
    relevanceEvidence: "",
    customNote: "",
    notes: "",
    followUpDate: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch leads and anti-spam metrics from PostgreSQL API
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (statusFilter !== "ALL") params.append("state", statusFilter);
      if (domainFilter !== "ALL") params.append("domain", domainFilter);

      const res = await fetch(`/api/network?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load networking contacts from server");
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
        if (data.antiSpam) setAntiSpam(data.antiSpam);
      } else {
        throw new Error(data.error || "Unknown server error");
      }
    } catch (err: any) {
      setError(err.message || "Unable to fetch contacts");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, statusFilter, domainFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Unique domains available for filtering
  const availableDomains = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.domainFocus) set.add(l.domainFocus);
    });
    return Array.from(set);
  }, [leads]);

  // Handle Clipboard Copy
  const handleCopyNote = (lead: NetworkLeadItem) => {
    navigator.clipboard.writeText(lead.connectionNote.text);
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Handle Confirm Contacted (persisted to DB)
  const handleConfirmContacted = async (leadId: string) => {
    try {
      setActionInProgress(leadId);
      const res = await fetch("/api/network", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: leadId,
          action: "CONFIRM_CONTACTED",
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchLeads();
      } else {
        alert(data.error || "Failed to confirm contact");
      }
    } catch (err) {
      alert("Network error updating contact status");
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Do Not Contact toggle (persisted to DB)
  const handleDoNotContact = async (leadId: string) => {
    if (!confirm("Add this person to the Do-Not-Contact blacklist? This strictly blocks all future drafts.")) {
      return;
    }
    try {
      setActionInProgress(leadId);
      const res = await fetch("/api/network", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: leadId,
          action: "SET_DO_NOT_CONTACT",
          reason: "User requested exclusion from networking page",
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchLeads();
      } else {
        alert(data.error || "Failed to update exclusion list");
      }
    } catch (err) {
      alert("Network error updating exclusion");
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Delete Contact
  const handleDeleteContact = async (leadId: string) => {
    if (!confirm("Are you sure you want to remove this contact from your network?")) return;
    try {
      setActionInProgress(leadId);
      const res = await fetch(`/api/network?id=${encodeURIComponent(leadId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        await fetchLeads();
      } else {
        alert(data.error || "Failed to delete contact");
      }
    } catch (err) {
      alert("Error deleting contact");
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Add Contact Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!addForm.fullName.trim() || !addForm.company.trim() || !addForm.roleTitle.trim()) {
      setFormError("Full name, company, and role title are required.");
      return;
    }
    if (!addForm.profileUrl.trim().startsWith("http")) {
      setFormError("Profile URL must be a valid HTTP/HTTPS URL (e.g. LinkedIn or GitHub).");
      return;
    }
    if (!addForm.provenanceUrl.trim().startsWith("http")) {
      setFormError("Provenance URL must be a valid public source where you identified this person.");
      return;
    }

    try {
      setActionInProgress("add");
      const res = await fetch("/api/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setAddForm({
          fullName: "",
          roleTitle: "",
          company: "",
          category: "ENGINEER_MAINTAINER",
          profileUrl: "",
          provenanceUrl: "",
          domainFocus: "",
          relevanceEvidence: "",
          customNote: "",
          notes: "",
          followUpDate: "",
        });
        await fetchLeads();
      } else {
        setFormError(data.error || "Failed to add contact.");
      }
    } catch (err: any) {
      setFormError(err.message || "Server error while saving contact.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Update Notes & Follow-up
  const handleUpdateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    try {
      setActionInProgress(`edit-${editingLead.id}`);
      const res = await fetch("/api/network", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingLead.id,
          action: "UPDATE_DETAILS",
          notes: editingLead.notes || "",
          followUpDate: editingLead.followUpDate || null,
          connectionState: editingLead.connectionState,
          connectionNoteText: editingLead.connectionNote.text,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingLead(null);
        await fetchLeads();
      } else {
        alert(data.error || "Failed to update contact notes");
      }
    } catch (err) {
      alert("Error saving notes");
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-16">
      {/* OmniDimension Clean Light Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
              Professional Network & Relationship Engine
            </h1>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold tracking-wider">
              OMNIDIMENSION LIGHT
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
            Curated one-to-one professional relationships across Computer Vision, Distributed Systems, Embedded Microcontrollers, and Campus Talent. Zero automated scraping or browser bot routines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl omni-btn-primary text-xs flex items-center gap-2 shadow-sm font-semibold"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Real Contact</span>
          </button>

          <button
            type="button"
            onClick={() => fetchLeads()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-300 transition shadow-xs"
            title="Refresh from PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* OmniDimension Light Telemetry Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl omni-card flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Anti-Spam Daily Limit
            </div>
            <div className="text-xl font-black font-mono text-slate-900 mt-1">
              {antiSpam.dailyDraftCount} / {antiSpam.dailyCap}{" "}
              <span className="text-xs font-normal text-slate-500">prepared/day</span>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
            {antiSpam.isDailyCapReached ? "CAP REACHED" : "HEALTHY"}
          </span>
        </div>

        <div className="p-4 rounded-2xl omni-card flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium tracking-wide">
              <Clock className="w-3.5 h-3.5 text-cyan-600" />
              60-Day Deduplication
            </div>
            <div className="text-xl font-black font-mono text-slate-900 mt-1">
              {antiSpam.recentContactsCount}{" "}
              <span className="text-xs font-normal text-slate-500">in cooldown</span>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold">
            ENFORCED
          </span>
        </div>

        <div className="p-4 rounded-2xl omni-card flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium tracking-wide">
              <Ban className="w-3.5 h-3.5 text-rose-500" />
              Exclusion Blacklist
            </div>
            <div className="text-xl font-black font-mono text-slate-900 mt-1">
              {antiSpam.doNotContactCount}{" "}
              <span className="text-xs font-normal text-slate-500">protected</span>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
            ACTIVE
          </span>
        </div>

        <div className="p-4 rounded-2xl omni-card flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium tracking-wide">
              <Cpu className="w-3.5 h-3.5 text-teal-600" />
              Safety Policy Gate
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">Manual Copy Handoff</div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
            COMPLIANT
          </span>
        </div>
      </div>

      {/* Search & OmniDimension Light Filter Controls */}
      <div className="omni-card rounded-2xl p-4.5 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, organization, technical domain, PyTorch, WaferOS, or ESP32..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-xs transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tabs & Secondary Selectors */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-1">
          {/* OmniDimension Light Capsule Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: "All Contacts" },
              { id: "ENGINEER_MAINTAINER", label: "Engineers & Maintainers" },
              { id: "EMBEDDED_HARDWARE", label: "Embedded / Hardware" },
              { id: "ALUMNI", label: "Alumni & Mentors" },
              { id: "RECRUITER_TALENT", label: "Recruiters & Talent" },
            ].map((tab) => {
              const active = categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold shadow-md shadow-teal-600/25"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200/60"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Secondary Select Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-teal-500"
            >
              <option value="ALL">Status: All</option>
              <option value="IDENTIFIED">Identified</option>
              <option value="DRAFTED">Drafted</option>
              <option value="CONTACTED">Contacted</option>
              <option value="CONNECTED">Connected</option>
              <option value="DO_NOT_CONTACT">Do Not Contact</option>
            </select>

            {availableDomains.length > 0 && (
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-teal-500 max-w-[210px] truncate"
              >
                <option value="ALL">Domain: All</option>
                {availableDomains.map((dom) => (
                  <option key={dom} value={dom}>
                    {dom}
                  </option>
                ))}
              </select>
            )}

            {(searchQuery || categoryFilter !== "ALL" || statusFilter !== "ALL" || domainFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("ALL");
                  setStatusFilter("ALL");
                  setDomainFilter("ALL");
                }}
                className="text-xs text-teal-700 hover:underline px-2 py-1 font-mono font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchLeads()} className="underline font-semibold text-rose-700">
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl omni-card animate-pulse space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />
                  <div className="space-y-2">
                    <div className="w-48 h-4 rounded bg-slate-200" />
                    <div className="w-32 h-3 rounded bg-slate-200" />
                  </div>
                </div>
                <div className="w-20 h-4 rounded bg-slate-200" />
              </div>
              <div className="w-full h-16 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && leads.length === 0 && (
        <div className="p-12 rounded-2xl omni-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mx-auto shadow-sm">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No contacts match your query</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Reset search query or filters, or add a new verified contact to your pipeline.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("ALL");
                setStatusFilter("ALL");
                setDomainFilter("ALL");
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl omni-btn-primary text-xs flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add First Contact</span>
            </button>
          </div>
        </div>
      )}

      {/* OmniDimension Light Contact Cards List */}
      {!loading && leads.length > 0 && (
        <div className="space-y-5">
          <div className="text-xs text-slate-500 flex items-center justify-between px-1">
            <span>Showing <strong className="text-teal-700 font-mono font-bold">{leads.length}</strong> verified professional contacts</span>
            <span className="font-mono text-slate-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Zero Platform Risk Policy
            </span>
          </div>

          {leads.map((lead) => {
            const isContacted = lead.connectionState === "CONTACTED" || lead.connectionState === "CONNECTED";
            const isDnc = lead.isDoNotContact;
            const isBusy = actionInProgress === lead.id;

            return (
              <div
                key={lead.id}
                className={`rounded-2xl p-6 transition-all space-y-5 omni-card ${
                  isDnc
                    ? "border-rose-200 bg-rose-50/40 opacity-70"
                    : isContacted
                    ? "border-teal-300 bg-white shadow-sm"
                    : "border-slate-200/90 hover:border-teal-400"
                }`}
              >
                {/* Header: Avatar, Name, Category Pill, Fit Score */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                      {lead.fullName.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">{lead.fullName}</h3>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-teal-50 text-teal-700 border border-teal-200 font-semibold">
                          {lead.category.replace(/_/g, " ")}
                        </span>
                        {isContacted && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                            {lead.connectionState}
                          </span>
                        )}
                        {isDnc && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <Ban className="w-3 h-3 text-rose-600" />
                            DO NOT CONTACT
                          </span>
                        )}
                        {lead.followUpDate && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            Follow up: {new Date(lead.followUpDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-teal-700 font-medium mt-1">
                        {lead.roleTitle} @ <strong className="text-slate-900 font-semibold">{lead.company}</strong>
                      </p>

                      <p className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-1.5 font-mono">
                        <span className="text-slate-400">Provenance Source:</span>
                        <a
                          href={lead.provenanceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-600 hover:underline flex items-center gap-0.5 font-medium"
                        >
                          <span>{lead.provenanceUrl.replace("https://", "").slice(0, 48)}...</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5">
                    <div className="text-xs font-mono font-bold text-teal-800 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 shadow-xs">
                      Match Fit: {lead.score}%
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {isContacted && lead.lastContactedAt
                        ? `Contacted on ${new Date(lead.lastContactedAt).toLocaleDateString()}`
                        : "Ready for outreach"}
                    </div>
                  </div>
                </div>

                {/* OmniDimension Recessed Technical Alignment Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                      <Award className="w-3.5 h-3.5 text-teal-600" />
                      Shared Technical Context
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      Domain: <strong className="text-slate-800">{lead.domainFocus}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-teal-700 block mb-0.5 font-mono">
                        Your Verified Work
                      </span>
                      <span className="text-slate-700 text-xs leading-snug">
                        {lead.sharedTechnicalReason.userSkillOrProject}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-cyan-700 block mb-0.5 font-mono">
                        Recipient Focus
                      </span>
                      <span className="text-slate-700 text-xs leading-snug">
                        {lead.sharedTechnicalReason.recipientWork}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Private Notes Display */}
                {lead.notes && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1 font-mono">
                      <BookOpen className="w-3 h-3 text-amber-600" />
                      Private Relationship Notes
                    </span>
                    <p className="text-slate-700 text-xs italic">{lead.notes}</p>
                  </div>
                )}

                {/* Connection Note Container */}
                {!isDnc && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-slate-700 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        Tailored LinkedIn Connection Note
                      </span>
                      <span className={`font-mono text-[11px] ${
                        lead.connectionNote.characterCount > 300 ? "text-rose-600 font-bold" : "text-slate-500"
                      }`}>
                        {lead.connectionNote.characterCount} / 300 chars (LinkedIn Limit)
                      </span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans select-all shadow-inner">
                      {lead.connectionNote.text}
                    </div>
                  </div>
                )}

                {/* Card Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Manual handoff: Copy note &rarr; open profile &rarr; paste & send.
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isDnc && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCopyNote(lead)}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition flex items-center gap-1.5 shadow-xs"
                        >
                          {copiedId === lead.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-teal-700" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Note</span>
                            </>
                          )}
                        </button>

                        <a
                          href={lead.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                          <span>Open Profile</span>
                        </a>

                        {!isContacted ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleConfirmContacted(lead.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Confirm Contacted</span>
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-700 font-mono px-2 py-1 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Contacted
                          </span>
                        )}
                      </>
                    )}

                    {/* Manage Notes Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => setEditingLead(lead)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs border border-slate-200 transition flex items-center gap-1"
                      title="Edit Notes & Follow-Up Date"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Do Not Contact Toggle */}
                    {!isDnc && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDoNotContact(lead.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs transition"
                        title="Add to Do Not Contact list"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete Contact */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDeleteContact(lead.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs transition"
                      title="Remove contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Contact Modal — OmniDimension Light Glass Styling */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Add Real Professional Contact
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-teal-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.fullName}
                    onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                    placeholder="e.g. Dr. Elena Rostova"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role Title <span className="text-teal-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.roleTitle}
                    onChange={(e) => setAddForm({ ...addForm, roleTitle: e.target.value })}
                    placeholder="e.g. Principal ML Systems Engineer"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company / Organization <span className="text-teal-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.company}
                    onChange={(e) => setAddForm({ ...addForm, company: e.target.value })}
                    placeholder="e.g. Anthropic, Google, PyTorch"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relationship Category <span className="text-teal-600">*</span>
                  </label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value as LeadCategory })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="ENGINEER_MAINTAINER">Engineer & Maintainer</option>
                    <option value="EMBEDDED_HARDWARE">Embedded & Hardware</option>
                    <option value="ALUMNI">Alumni & Mentor</option>
                    <option value="RECRUITER_TALENT">Recruiter & Talent</option>
                    <option value="FOUNDER_HIRING_MGR">Founder & Hiring Manager</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Public Profile URL <span className="text-teal-600">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={addForm.profileUrl}
                  onChange={(e) => setAddForm({ ...addForm, profileUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/... or https://github.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verified Public Provenance Source <span className="text-teal-600">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={addForm.provenanceUrl}
                  onChange={(e) => setAddForm({ ...addForm, provenanceUrl: e.target.value })}
                  placeholder="https://github.com/repo/commits or official conference speaker URL"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                  Evidence Rule 1: Every contact must link to verifiable source material.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Domain Focus
                </label>
                <input
                  type="text"
                  value={addForm.domainFocus}
                  onChange={(e) => setAddForm({ ...addForm, domainFocus: e.target.value })}
                  placeholder="e.g. Computer Vision, Distributed Backend, ESP32 Firmware"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Connection Note (Optional, max 300 chars)
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={addForm.customNote}
                  onChange={(e) => setAddForm({ ...addForm, customNote: e.target.value })}
                  placeholder="Leave blank to auto-generate from your verified GCET ECE 2028 & WaferOS background..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-teal-700 block text-right font-mono mt-0.5 font-medium">
                  {addForm.customNote.length} / 300 chars
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relationship Notes
                  </label>
                  <input
                    type="text"
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                    placeholder="e.g. Met at edge symposium, referred by mentor"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={addForm.followUpDate}
                    onChange={(e) => setAddForm({ ...addForm, followUpDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress === "add"}
                  className="px-5 py-2 rounded-xl omni-btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionInProgress === "add" ? "Saving..." : "Save to Network"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Notes & Follow-Up Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-teal-600" />
                Manage Relationship: {editingLead.fullName}
              </h2>
              <button
                onClick={() => setEditingLead(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateNotes} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship Status
                </label>
                <select
                  value={editingLead.connectionState}
                  onChange={(e) =>
                    setEditingLead({
                      ...editingLead,
                      connectionState: e.target.value as RelationshipState,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                >
                  <option value="IDENTIFIED">Identified</option>
                  <option value="DRAFTED">Drafted</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="CONNECTED">Connected</option>
                  <option value="UNRESPONSIVE">Unresponsive</option>
                  <option value="DO_NOT_CONTACT">Do Not Contact</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Private Notes & Context
                </label>
                <textarea
                  rows={3}
                  value={editingLead.notes || ""}
                  onChange={(e) =>
                    setEditingLead({
                      ...editingLead,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Record conversation takeaways, project advice, mutual contacts..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Next Follow-Up Reminder Date
                </label>
                <input
                  type="date"
                  value={editingLead.followUpDate ? editingLead.followUpDate.split("T")[0] : ""}
                  onChange={(e) =>
                    setEditingLead({
                      ...editingLead,
                      followUpDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Connection Note Text (max 300 chars)
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={editingLead.connectionNote.text}
                  onChange={(e) =>
                    setEditingLead({
                      ...editingLead,
                      connectionNote: {
                        ...editingLead.connectionNote,
                        text: e.target.value,
                        characterCount: e.target.value.length,
                        isWithinLimit: e.target.value.length <= 300,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-teal-700 block text-right font-mono mt-0.5 font-medium">
                  {editingLead.connectionNote.text.length} / 300 chars
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress?.startsWith("edit")}
                  className="px-5 py-2 rounded-xl omni-btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
