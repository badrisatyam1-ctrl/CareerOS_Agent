"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Share2,
  Users,
  Briefcase,
  Mail,
  GitBranch,
  GitPullRequest,
  BookOpen,
  Activity,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Cpu,
} from "lucide-react";

const NAVIGATION_ITEMS = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "LinkedIn Studio", href: "/linkedin", icon: Share2 },
  { name: "Network", href: "/network", icon: Users },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Email Outreach", href: "/outreach", icon: Mail },
  { name: "GitHub Lab", href: "/github", icon: GitBranch },
  { name: "Contributions/PRs", href: "/contributions", icon: GitPullRequest },
  { name: "Interview Prep", href: "/interview", icon: BookOpen },
  { name: "Activity Log", href: "/activity", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-w-[16rem] bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0 z-20 shadow-sm select-none">
      {/* Brand & Identity — OmniDimension Clean Light Styling */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white font-black shadow-md shadow-teal-500/20">
            <Cpu className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1.5 font-sans">
              CareerOS
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-bold tracking-wider">
                Agent
              </span>
            </h1>
            <p className="text-xs text-slate-500">Badri Vishal Pandey</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-teal-50 text-teal-800 border border-teal-200 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
              {item.name}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-600 shadow-[0_0_6px_#0d9488]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mode Indicator & Security Status Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/60 space-y-2">
        <Link
          href="/settings"
          className="block rounded-xl bg-white hover:bg-teal-50/50 p-3 border border-slate-200 hover:border-teal-300 transition group shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-teal-700 font-semibold uppercase tracking-wider">
              Integration Mode
            </span>
            <span className="text-[10px] text-slate-400 group-hover:text-teal-600 transition">Settings →</span>
          </div>
          <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
            </span>
            <span>5-Level Controlled State</span>
          </div>
        </Link>

        <div className="rounded-xl bg-white p-3 border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Approval Gate: Active</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Zero external writes occur without explicit, action-specific approval.
          </p>
        </div>
      </div>
    </aside>
  );
}
