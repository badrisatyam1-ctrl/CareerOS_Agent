"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Settings,
  Shield,
  Key,
  User,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Lock,
  RefreshCw,
  Zap,
  ArrowRight,
  Info,
} from "lucide-react";
import { PROVIDER_CAPABILITY_MATRICES } from "@/integrations/registry";

interface IntegrationState {
  provider: "GITHUB" | "GMAIL" | "LINKEDIN";
  mode: "DEMO" | "REAL_CONNECTED_READ_ONLY" | "REAL_DRAFT_ONLY" | "REAL_APPROVAL_REQUIRED" | "REAL_WRITE_ENABLED";
  connectionState: string;
  externalAccountId: string | null;
  grantedScopes: string[];
  lastSyncAt: string | null;
}

const MODE_LABELS: Record<string, string> = {
  DEMO: "🧪 Demo Mode (Mock)",
  REAL_CONNECTED_READ_ONLY: "👁 Real Read-Only",
  REAL_DRAFT_ONLY: "📝 Real Draft-Only",
  REAL_APPROVAL_REQUIRED: "🔐 Real Approval-Required",
  REAL_WRITE_ENABLED: "✅ Real Write-Enabled",
};

const MODE_COLORS: Record<string, string> = {
  DEMO: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  REAL_CONNECTED_READ_ONLY: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  REAL_DRAFT_ONLY: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  REAL_APPROVAL_REQUIRED: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  REAL_WRITE_ENABLED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const connectedParam = searchParams.get("connected");
  const errorParam = searchParams.get("error");
  const modeParam = searchParams.get("mode");

  const [gradYear, setGradYear] = useState<number>(2028);
  const [integrations, setIntegrations] = useState<IntegrationState[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Direct Token / PAT Connect state
  const [tokenInputVisible, setTokenInputVisible] = useState<boolean>(false);
  const [tokenInputValue, setTokenInputValue] = useState<string>("");
  const [tokenConnecting, setTokenConnecting] = useState<boolean>(false);

  const handleTokenConnect = async (provider: string) => {
    if (!tokenInputValue.trim()) return;
    setTokenConnecting(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/auth/connect/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, token: tokenInputValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to connect token");
      }
      setActionMessage({
        text: `Connected @${data.username} successfully in ${data.mode}! Scopes: [${data.scopes?.join(", ") || "read:user"}]`,
        type: "success",
      });
      setTokenInputValue("");
      setTokenInputVisible(false);
      fetchIntegrations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionMessage({ text: msg, type: "error" });
    } finally {
      setTokenConnecting(false);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const res = await fetch("/api/integrations");
      if (res.ok) {
        const data = await res.json();
        if (data.modes) {
          setIntegrations(data.modes);
        }
      }
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  useEffect(() => {
    if (connectedParam) {
      setActionMessage({
        text: `Successfully connected ${connectedParam.toUpperCase()}! Current mode: ${modeParam || "REAL_CONNECTED_READ_ONLY"}`,
        type: "success",
      });
    } else if (errorParam) {
      setActionMessage({
        text: `Integration error: ${errorParam}`,
        type: "error",
      });
    }
  }, [connectedParam, errorParam, modeParam]);

  const handleModeTransition = async (provider: string, targetMode: string) => {
    try {
      setActionMessage(null);
      const res = await fetch("/api/integrations/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, targetMode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update integration mode");
      }

      setActionMessage({
        text: `${provider} transitioned to ${targetMode}`,
        type: "success",
      });
      fetchIntegrations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionMessage({ text: msg, type: "error" });
    }
  };

  const handleDisconnect = async (provider: string, externalAccountId: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider} and purge stored OAuth tokens?`)) {
      return;
    }

    try {
      setActionMessage(null);
      const res = await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, externalAccountId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to disconnect account");
      }

      setActionMessage({
        text: `Disconnected ${provider} and purged encrypted tokens.`,
        type: "success",
      });
      fetchIntegrations();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionMessage({ text: msg, type: "error" });
    }
  };

  const getProviderState = (provider: "GITHUB" | "GMAIL" | "LINKEDIN"): IntegrationState => {
    return (
      integrations.find((i) => i.provider === provider) || {
        provider,
        mode: "DEMO",
        connectionState: "DEMO_MOCK",
        externalAccountId: null,
        grantedScopes: [],
        lastSyncAt: null,
      }
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-teal-600" />
            Integration Framework & Operational Controls
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Strict 5-level integration progression (DEMO → READ_ONLY → DRAFT → APPROVAL → WRITE).
          </p>
        </div>
      </div>

      {/* Notifications / Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            actionMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile & Graduation Date */}
        <div className="omni-card border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <User className="w-5 h-5 text-teal-600" />
            <h2>Profile & Graduation Verification</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="text-slate-600 font-semibold">Full Name:</label>
              <input
                type="text"
                readOnly
                value="Badri Vishal Pandey"
                className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="text-slate-600 font-semibold">Institution & Major:</label>
              <input
                type="text"
                readOnly
                value="Galgotias College of Eng. & Tech (ECE)"
                className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium"
              />
            </div>
            <div>
              <label className="text-slate-600 font-semibold">Confirmed Graduation Year:</label>
              <select
                value={gradYear}
                onChange={(e) => setGradYear(Number(e.target.value))}
                className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-teal-600 font-medium"
              >
                <option value={2028}>2028 (Confirmed Batch — 3rd Year ECE @ GCET)</option>
                <option value={2027}>2027 (Prior Resume Draft)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Used to filter internship eligibility rules automatically.
              </p>
            </div>
            <div>
              <label className="text-slate-600 font-semibold">Primary Target Locations:</label>
              <input
                type="text"
                readOnly
                value="Remote, Bengaluru, Noida, India"
                className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 5-Level Integration Progression Cards */}
        <div className="omni-card border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Zap className="w-5 h-5 text-teal-600" />
                <h2>Connected Accounts & 5-Level Mode State Machine</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Elevate permissions sequentially: DEMO → READ_ONLY → DRAFT_ONLY → APPROVAL_REQUIRED → WRITE_ENABLED.
              </p>
            </div>
            <button
              onClick={fetchIntegrations}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 shadow-xs font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-600" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* GITHUB */}
            {(() => {
              const gh = getProviderState("GITHUB");
              const isConnected = gh.connectionState === "CONNECTED";

              return (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">GitHub (App / OAuth)</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${MODE_COLORS[gh.mode]}`}>
                          {MODE_LABELS[gh.mode] || gh.mode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {gh.externalAccountId ? `@${gh.externalAccountId}` : "Not connected to live account"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {gh.mode === "DEMO" ? (
                        <>
                          <a
                            href="/api/auth/connect/github"
                            className="px-3.5 py-1.5 rounded-lg omni-btn-primary text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Connect via OAuth</span>
                          </a>
                          <button
                            onClick={() => setTokenInputVisible(!tokenInputVisible)}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition border border-slate-300 flex items-center gap-1.5 shadow-xs"
                          >
                            <Key className="w-3.5 h-3.5 text-teal-600" />
                            <span>{tokenInputVisible ? "Cancel PAT" : "Connect via PAT / Token"}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDisconnect("GITHUB", gh.externalAccountId || "")}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition border border-rose-200 shadow-xs"
                        >
                          Disconnect & Wipe Tokens
                        </button>
                      )}
                    </div>
                  </div>

                  {tokenInputVisible && gh.mode === "DEMO" && (
                    <div className="p-3.5 rounded-xl bg-white border border-teal-300 space-y-2 mt-2 shadow-sm">
                      <div className="flex items-center gap-2 text-xs text-teal-800 font-semibold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Direct GitHub Personal Access Token (Read-Only Minimum Scopes)</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Create a fine-grained or classic PAT with <code className="text-slate-800 font-semibold">read:user</code> and <code className="text-slate-800 font-semibold">public_repo</code> permissions. The token is validated against GitHub API, encrypted with AES-256-GCM, and placed safely into <strong>REAL_CONNECTED_READ_ONLY</strong> mode.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value={tokenInputValue}
                          onChange={(e) => setTokenInputValue(e.target.value)}
                          placeholder="ghp_... or github_pat_..."
                          className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono focus:border-teal-600 focus:outline-none"
                        />
                        <button
                          disabled={tokenConnecting || !tokenInputValue.trim()}
                          onClick={() => handleTokenConnect("GITHUB")}
                          className="px-3.5 py-1.5 rounded-lg omni-btn-primary disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                        >
                          {tokenConnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          <span>{tokenConnecting ? "Validating..." : "Connect Read-Only"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isConnected && (
                    <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-600 font-medium">Step progression:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(["DEMO", "REAL_CONNECTED_READ_ONLY", "REAL_DRAFT_ONLY", "REAL_APPROVAL_REQUIRED", "REAL_WRITE_ENABLED"] as const).map(
                          (m) => (
                            <button
                              key={m}
                              disabled={gh.mode === m}
                              onClick={() => handleModeTransition("GITHUB", m)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                                gh.mode === m
                                  ? "omni-btn-primary text-white border-transparent"
                                  : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50 shadow-xs"
                              }`}
                            >
                              {m.replace("REAL_", "")}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* GMAIL */}
            {(() => {
              const gm = getProviderState("GMAIL");
              const isConnected = gm.connectionState === "CONNECTED";

              return (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Gmail (Google OAuth)</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${MODE_COLORS[gm.mode]}`}>
                          {MODE_LABELS[gm.mode] || gm.mode}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {gm.externalAccountId ? gm.externalAccountId : "Not connected to live account"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isConnected ? (
                        <a
                          href="/api/auth/connect/gmail"
                          className="px-3.5 py-1.5 rounded-lg omni-btn-primary text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Connect Real Gmail</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => handleDisconnect("GMAIL", gm.externalAccountId || "")}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition border border-rose-200 shadow-xs"
                        >
                          Disconnect & Wipe Tokens
                        </button>
                      )}
                    </div>
                  </div>

                  {isConnected && (
                    <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-600 font-medium">Step progression:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(["DEMO", "REAL_CONNECTED_READ_ONLY", "REAL_DRAFT_ONLY", "REAL_APPROVAL_REQUIRED", "REAL_WRITE_ENABLED"] as const).map(
                          (m) => (
                            <button
                              key={m}
                              disabled={gm.mode === m}
                              onClick={() => handleModeTransition("GMAIL", m)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border ${
                                gm.mode === m
                                  ? "omni-btn-primary text-white border-transparent"
                                  : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50 shadow-xs"
                              }`}
                            >
                              {m.replace("REAL_", "")}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* LINKEDIN */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">LinkedIn (Official API / Manual Handoff)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold border bg-teal-50 text-teal-800 border-teal-200">
                      Manual Handoff Policy
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    No scraping or headless automation permitted. Prepared posts open official compose window.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500 font-medium">Draft + 1-Click Copy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Provider Capability Matrix */}
        <div className="omni-card border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                Provider Capability Matrix & Scope Explanations
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed audit of what each capability allows and required security gates.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 font-medium">Adapter Standard</span>
          </div>

          <div className="space-y-6">
            {PROVIDER_CAPABILITY_MATRICES.map((matrix) => (
              <div key={matrix.provider} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{matrix.displayName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-white text-slate-600 border border-slate-200">
                      Auth: {matrix.authMethod}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {matrix.capabilities.map((cap) => (
                    <div
                      key={cap.capabilityId}
                      className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col justify-between text-xs space-y-2 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">{cap.name}</span>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold ${
                              cap.status === "supported"
                                ? "bg-teal-50 text-teal-700 border border-teal-200"
                                : cap.status === "requires approval/access"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {cap.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          {cap.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-medium">{cap.isWriteOperation ? "🔒 Write (Gated)" : "👁 Read-Only"}</span>
                        <span>{cap.requiredScopes.length > 0 ? cap.requiredScopes[0] : "No scope needed"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Token Encryption */}
        <div className="omni-card border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Shield className="w-5 h-5 text-teal-600" />
            <h2>Security & Cryptographic Standards</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold">Secret Encryption:</span>
              <p className="font-mono text-teal-700 font-bold">AES-256-GCM (Authenticated)</p>
              <p className="text-[11px] text-slate-600 mt-1">
                All OAuth tokens and API secrets encrypted at rest. Never logged or exposed to client.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 font-semibold">Action Hash Integrity:</span>
              <p className="font-mono text-teal-700 font-bold">SHA-256 Content Lock</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Approvals lock payload diffs and message text to prevent tampering.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
