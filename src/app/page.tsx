import Link from "next/link";
import {
  Briefcase,
  GitPullRequest,
  Mail,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCode2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import LiveTrackerWidget from "@/components/LiveTrackerWidget";

export default function OverviewPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome & Mission Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-teal-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Career Operations Console</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, Badri
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Targeting <span className="text-teal-700 font-semibold">Backend & Systems Engineering Internships</span> (Class of 2028, 3rd Year B.Tech ECE @ GCET). All outward outreach and remote writes remain gated behind explicit approvals.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/jobs"
              className="px-4 py-2.5 rounded-xl omni-btn-primary text-xs font-semibold flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>Explore 2 Matched Roles</span>
            </Link>
            <Link
              href="/contributions"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-sm flex items-center gap-2"
            >
              <GitPullRequest className="w-4 h-4 text-slate-600" />
              <span>View Workbench</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="omni-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Target Jobs Discovered</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">2</span>
            <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">1 Shortlisted</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Stripe (92.5% fit) & Datadog</p>
        </div>

        <div className="omni-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Recruiter Outreach</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">1</span>
            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Pending Approval</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Stripe University Talent Lead</p>
        </div>

        <div className="omni-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">GitHub Intelligence</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <FileCode2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">2 Repos</span>
            <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">1 Issue Triaged</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">wafer-defect-classification (5★)</p>
        </div>

        <div className="omni-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">LeetCode Problem Streak</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">184 Solved</span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">190-Day Streak</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">118 Easy / 62 Med / 4 Hard • 246 Active Days</p>
        </div>
      </div>

      {/* Real-Time Live Telemetry: LeetCode & GitHub */}
      <LiveTrackerWidget />

      {/* Main Content Grid: Approval Gate + Active Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Action Approval Gate & LinkedIn Studio Draft (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Approval Card */}
          <div className="omni-card border-2 border-amber-300 rounded-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Consequential Action Approval Required</h3>
                  <p className="text-xs text-slate-500">Security Gate §6: External communications require immediate verification</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-mono font-semibold border border-amber-200">
                TTL: 28m remaining
              </span>
            </div>

            <div className="mt-5 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Action:</span>
                  <span className="font-semibold text-slate-800">SEND_EMAIL (Gmail API)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Recipient:</span>
                  <span className="font-semibold text-teal-700">Ananya Sharma (University Talent Lead @ Stripe)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Target Role:</span>
                  <span className="text-slate-700">Software Engineering Intern - Infrastructure</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Payload SHA-256:</span>
                  <span className="font-mono text-[11px] text-slate-500 truncate max-w-xs">
                    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans italic">
                &ldquo;Hi Ananya, I noticed Stripe&apos;s opening for the Infrastructure SWE Intern role. As a B.Tech student graduating in 2028 from GCET (ECE) with experience building distributed projects like WaferOS and solving 184+ LeetCode problems (190-day streak), I would love to learn more about the team&apos;s engineering challenges...&rdquo;
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-300"
                >
                  Reject & Discard
                </button>
                <Link
                  href="/outreach"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Review & Approve Draft</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Active Contribution Workbench Card */}
          <div className="omni-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-teal-600" />
                  Contribution Workbench: Sandbox Run
                </h3>
                <p className="text-xs text-slate-500">Local isolated execution for open-source PR preparation</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200">
                TESTS PASSED (3/3)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Target Repository:</span>
                <span className="text-slate-800 font-mono font-medium">badrisatyam1-ctrl/wafer-defect-classification</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Issue #3:</span>
                <span className="text-slate-800">Add batch inference benchmark and latency profiling</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Working Branch:</span>
                <span className="text-teal-700 font-mono font-semibold">feat/batch-inference-benchmark</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-emerald-400 border border-slate-800 shadow-inner">
                $ pytest tests/test_benchmark.py -v<br />
                test_benchmark_throughput PASSED [100%]<br />
                <span className="text-slate-400">3 passed in 0.42s (Sandbox run exited with code 0)</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">Status: Patch ready for diff inspection</span>
              <Link
                href="/contributions"
                className="text-xs font-semibold text-teal-700 hover:text-teal-600 flex items-center gap-1"
              >
                Inspect Diff in Workbench <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Evidence Vault & Quick Actions (1 col) */}
        <div className="space-y-6">
          {/* Verified Evidence Vault Widget */}
          <div className="omni-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Evidence Vault
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">3 Verified Facts</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every resume claim, outreach line, and post strictly inherits provenance from this vault.
            </p>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>WaferOS Deep Learning</span>
                  <span className="text-[10px] text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                    VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                  5★ GitHub repo for semiconductor wafer defect classification.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>LeetCode Consistency</span>
                  <span className="text-[10px] text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                    VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  184 algorithmic problems solved with 190-day active streak (200 Days Badge).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>GCET Education (ECE)</span>
                  <span className="text-[10px] text-teal-700 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                    2028
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Enrolled B.Tech in Electronics & Communication Engineering.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Navigations */}
          <div className="omni-card rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Quick Shortcuts</h3>
            <div className="space-y-1.5">
              <Link
                href="/linkedin"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs text-slate-700 hover:text-teal-700 transition"
              >
                <span>Draft LinkedIn Post</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/interview"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs text-slate-700 hover:text-teal-700 transition"
              >
                <span>Practice Raft Consensus</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/activity"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs text-slate-700 hover:text-teal-700 transition"
              >
                <span>Audit & Security Logs</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/settings"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-xs text-slate-700 hover:text-teal-700 transition"
              >
                <span>Credential & Safety Settings</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
