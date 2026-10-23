"use client";

import { Bell, ExternalLink, Cpu } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/85 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      {/* Title & Path with OmniDimension Pulse */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
          </span>
          <span className="text-[11px] font-mono font-semibold text-teal-700 uppercase tracking-wider">
            Agent Core Active
          </span>
        </div>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-medium text-slate-600">
          Galgotias College of Eng. & Tech (ECE) • Class of 2028
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Public profile quick links */}
        <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 mr-2">
          <a
            href="https://portfolio-bjzy.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-teal-600 transition"
          >
            Portfolio <ExternalLink className="w-3 h-3 text-teal-600" />
          </a>
          <span className="text-slate-300">•</span>
          <a
            href="https://github.com/badrisatyam1-ctrl"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-teal-600 transition"
          >
            GitHub <ExternalLink className="w-3 h-3 text-teal-600" />
          </a>
          <span className="text-slate-300">•</span>
          <a
            href="https://leetcode.com/u/Badri1888/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-teal-600 transition"
          >
            LeetCode <ExternalLink className="w-3 h-3 text-teal-600" />
          </a>
        </div>

        {/* Action Gate Badge */}
        <Link
          href="/network"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium hover:bg-teal-100 hover:border-teal-300 shadow-sm transition"
        >
          <Cpu className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
          <span>Manual Approval Enforced</span>
        </Link>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-xs font-black text-white shadow-sm">
            BP
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">Badri Vishal</p>
            <p className="text-[10px] font-mono text-teal-600 mt-0.5">Admin (Self)</p>
          </div>
        </div>
      </div>
    </header>
  );
}
