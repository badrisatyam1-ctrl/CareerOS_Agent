"use client";

import { AlertTriangle } from "lucide-react";

export default function DemoBanner() {
  return (
    <div className="bg-amber-50/90 border-b border-amber-200/80 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className="font-bold text-amber-800">DEMO MODE ACTIVE:</span>
        <span className="text-amber-900/80">Running with zero external credentials. All actions, candidates, and records are isolated.</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="px-2 py-0.5 rounded bg-white text-[11px] font-mono text-slate-600 border border-slate-200 shadow-xs">
          Target Graduation: 2028
        </span>
        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
          Evidence Vault: Locked
        </span>
      </div>
    </div>
  );
}
