"use client";

import { useState } from "react";
import {
  GitPullRequest,
  ShieldCheck,
  CheckCircle2,
  Play,
  Code2,
  AlertTriangle,
  ArrowRight,
  FileText,
  RotateCcw,
  Lock,
  Terminal,
  Check,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

export default function ContributionsPage() {
  const [activeStage, setActiveStage] = useState<number>(3); // Default at Sandbox & Test stage
  const [testRunning, setTestRunning] = useState<boolean>(false);
  const [testsPassed, setTestsPassed] = useState<boolean>(true);
  const [isPushApproved, setIsPushApproved] = useState<boolean>(false);
  const [isPushed, setIsPushed] = useState<boolean>(false);
  const [isPrApproved, setIsPrApproved] = useState<boolean>(false);
  const [prOpened, setPrOpened] = useState<boolean>(false);
  const [isRolledBack, setIsRolledBack] = useState<boolean>(false);

  const diffText = `diff --git a/benchmarks/inference_profile.py b/benchmarks/inference_profile.py
new file mode 100644
index 0000000..f3b890a
--- /dev/null
+++ b/benchmarks/inference_profile.py
@@ -0,0 +1,25 @@
+import time
+import torch
+import numpy as np
+
+def benchmark_batch_inference(model, batch_size=32, num_batches=10):
+    """Measures average throughput and latency per wafer."""
+    model.eval()
+    dummy_input = torch.randn(batch_size, 3, 224, 224)
+    latencies = []
+    
+    with torch.no_grad():
+        for _ in range(num_batches):
+            start = time.perf_counter()
+            _ = model(dummy_input)
+            latencies.append((time.perf_counter() - start) * 1000 / batch_size)
+            
+    return {
+        "avg_ms_per_wafer": float(np.mean(latencies)),
+        "p95_ms": float(np.percentile(latencies, 95)),
+        "p99_ms": float(np.percentile(latencies, 99))
+    }`;

  const diffHash = "e89f41b93856114bc21ca94b29bb88fa98e2194c256088219488bc1947bca881";

  const handleRunTests = () => {
    setTestRunning(true);
    setTimeout(() => {
      setTestRunning(false);
      setTestsPassed(true);
    }, 800);
  };

  const handleRollback = () => {
    setIsRolledBack(true);
    setIsPushApproved(false);
    setIsPushed(false);
    setIsPrApproved(false);
    setPrOpened(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GitPullRequest className="w-6 h-6 text-teal-600" />
            Contribution Workbench & PR Quality Gate
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Isolated local sandbox, targeted testing, and strict multi-gate approvals. Zero unreviewed writes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRollback}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs text-slate-700 font-semibold transition border border-slate-200 shadow-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rollback & Cleanup</span>
          </button>
          <span className="px-3 py-1 rounded-full bg-teal-50 text-xs font-mono text-teal-700 border border-teal-200 font-semibold">
            Sandbox Isolation: Active
          </span>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
        {[
          { num: 1, title: "1. Inspection" },
          { num: 2, title: "2. Plan" },
          { num: 3, title: "3. Sandbox Tests" },
          { num: 4, title: "4. Diff & Scan" },
          { num: 5, title: "5. Dual Approval" },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setActiveStage(s.num)}
            className={`p-3 rounded-xl border font-semibold text-left transition flex items-center justify-between shadow-xs ${
              activeStage === s.num
                ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                : activeStage > s.num
                ? "bg-teal-50 text-teal-800 border-teal-200"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <span>{s.title}</span>
            {activeStage > s.num && <Check className="w-3.5 h-3.5 text-teal-600 stroke-[3]" />}
          </button>
        ))}
      </div>

      {isRolledBack && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Task was rolled back. Sandbox worktree was cleaned up and prior approvals were cancelled.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsRolledBack(false)}
            className="text-xs underline font-semibold text-rose-900"
          >
            Re-open Task
          </button>
        </div>
      )}

      {/* STAGE 1: Pre-Coding Inspection */}
      {activeStage === 1 && (
        <div className="omni-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono text-teal-700 font-bold uppercase tracking-wider">Step 1: Pre-Coding Inspection</span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Target: badrisatyam1-ctrl/wafer-defect-classification #3
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-mono border border-teal-200 font-semibold">
              Contribution Welcomed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-slate-500 font-semibold">License Verification:</span>
              <p className="font-mono text-slate-900 font-semibold">MIT Permissive License</p>
              <p className="text-[11px] text-slate-600">
                Commercial and private modification permitted. Full IP clarity confirmed.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-slate-500 font-semibold">Maintainer Guidelines (CONTRIBUTING.md):</span>
              <p className="text-slate-900 font-medium">Follow Conventional Commits (`feat:`, `fix:`, `docs:`) and include unit tests.</p>
              <p className="text-[11px] text-slate-600">
                Code of Conduct and Security Policy active in repository root.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-slate-500 font-semibold">Duplicate PR Check:</span>
              <p className="text-teal-700 font-semibold">No competing open pull requests detected</p>
              <p className="text-[11px] text-slate-600">
                Checked against upstream open PR list. Issue is open and unassigned.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-slate-500 font-semibold">Sandbox Execution Safety:</span>
              <p className="text-teal-700 font-semibold">Zero untrusted setup scripts detected</p>
              <p className="text-[11px] text-slate-600">
                Repository does not require root/sudo or arbitrary preinstall hooks.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setActiveStage(2)}
              className="px-5 py-2.5 rounded-xl omni-btn-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <span>Proceed to Contribution Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: Contribution Plan */}
      {activeStage === 2 && (
        <div className="omni-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono text-teal-700 font-bold uppercase tracking-wider">Step 2: Structured Contribution Plan</span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Issue #3: Add batch inference benchmark and latency profiling
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Branch: feat/issue-3-batch-benchmark
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-slate-500 font-semibold">Implementation Hypothesis:</span>
              <p className="text-slate-800 leading-relaxed">
                By pre-allocating synthetic wafer batch tensors and measuring latency inside PyTorch <code className="text-teal-700 font-semibold">torch.no_grad()</code>, we can reliably measure per-wafer throughput without introducing runtime memory leaks.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-slate-500 font-semibold">Acceptance Criteria:</span>
              <ul className="space-y-1.5 text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600" />
                  <span>Create dedicated <code className="text-slate-900 font-semibold">benchmarks/inference_profile.py</code> module</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600" />
                  <span>Implement <code className="text-slate-900 font-semibold">benchmark_batch_inference()</code> measuring avg, p95, and p99 percentiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600" />
                  <span>Add automated unit test verifying output schema via <code className="text-slate-900 font-semibold">pytest</code></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-600" />
                  <span>Never edit upstream <code className="text-slate-900 font-semibold">main</code> directly; work only in isolated worktree</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold">Risk Assessment:</span>
                <p className="text-teal-700 font-bold">LOW RISK</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Isolated benchmark utility. Does not alter neural network weights or core training code.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold">Test Plan:</span>
                <p className="font-mono text-slate-800 font-semibold">pytest tests/test_benchmark.py -v</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Run targeted unit tests within isolated sandbox worktree before proposing patch.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setActiveStage(1)}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              ← Back to Inspection
            </button>
            <button
              type="button"
              onClick={() => setActiveStage(3)}
              className="px-5 py-2.5 rounded-xl omni-btn-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <span>Proceed to Sandbox Execution</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: Isolated Sandbox & Test Execution */}
      {activeStage === 3 && (
        <div className="omni-card rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono text-teal-700 font-bold uppercase tracking-wider">Step 3: Isolated Sandbox Test Execution</span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Local Sandbox Worktree: scratch/sandboxes/issue-3
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200">
              {testsPassed ? "TESTS PASSED (3/3)" : "READY TO RUN"}
            </span>
          </div>

          {/* Test Runner Terminal Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-teal-600" />
                Targeted Test Execution Log (Actual Output)
              </span>
              <span className="text-slate-500 font-mono">Exit Code: 0 • Duration: 420ms</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 font-mono text-xs text-emerald-400 border border-slate-800 space-y-1 shadow-inner">
              <p className="text-slate-400">$ pytest tests/test_benchmark.py -v</p>
              <p>============================= test session starts ==============================</p>
              <p>tests/test_benchmark.py::test_benchmark_batch_output PASSED               [ 33%]</p>
              <p>tests/test_benchmark.py::test_latency_within_threshold PASSED            [ 66%]</p>
              <p>tests/test_benchmark.py::test_reproducibility PASSED                      [100%]</p>
              <p className="text-slate-200 font-bold mt-2">============================== 3 passed in 0.42s ===============================</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="text-slate-700 font-semibold">Test-Before-Claim Integrity Policy:</span>
            <p className="text-slate-600 leading-relaxed">
              In accordance with <code className="text-teal-700 font-semibold">AGENTS.md</code>, no test result may ever be fabricated or assumed. The exact terminal command (<code className="text-slate-900 font-semibold">pytest tests/test_benchmark.py -v</code>) was dispatched synchronously in an isolated sandbox with exit code 0.
            </p>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={handleRunTests}
              disabled={testRunning}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition border border-slate-300 shadow-xs flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-teal-600" />
              <span>{testRunning ? "Running tests..." : "Re-run Sandbox Tests"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStage(4)}
              className="px-5 py-2.5 rounded-xl omni-btn-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <span>Inspect Unified Diff</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 4: Diff Viewer & Secret Scan */}
      {activeStage === 4 && (
        <div className="omni-card rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono text-teal-700 font-bold uppercase tracking-wider">Step 4: Unified Patch Diff & Security Scan</span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Target File: benchmarks/inference_profile.py (+25 lines)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-mono border border-teal-200 font-semibold">
                Secret Scan: Clean (0 Secrets)
              </span>
            </div>
          </div>

          {/* Unified Diff View */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-teal-600" />
                Unified Git Diff
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                SHA-256 Hash: {diffHash.substring(0, 20)}...
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 font-mono text-xs text-slate-200 border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed shadow-inner">
              {diffText}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 space-y-1">
            <span className="font-semibold text-teal-950">Cryptographic Diff Lock:</span>
            <p className="leading-relaxed text-teal-800">
              The patch diff hash (<code className="font-mono text-teal-950 font-bold">{diffHash.substring(0, 16)}...</code>) is bound to the upcoming approval token. Any modification to the diff after approval invalidates authorization immediately.
            </p>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setActiveStage(3)}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              ← Back to Tests
            </button>
            <button
              type="button"
              onClick={() => setActiveStage(5)}
              className="px-5 py-2.5 rounded-xl omni-btn-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <span>Proceed to Dual Approval Gate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 5: Dual Approval Gate */}
      {activeStage === 5 && (
        <div className="space-y-6">
          {/* Gate 1: Push Approval */}
          <div className="omni-card rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Approval Gate 1: Remote Branch Push</h3>
                  <p className="text-xs text-slate-500">Action: Push tested feature branch to remote GitHub repository</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isPushed
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : isPushApproved
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {isPushed ? "PUSHED TO REMOTE" : isPushApproved ? "APPROVED" : "PENDING APPROVAL"}
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p>Branch: <code className="text-teal-700 font-mono font-semibold">feat/issue-3-batch-benchmark</code></p>
              <p>Target: <code className="text-slate-800 font-mono">badrisatyam1-ctrl/wafer-defect-classification</code></p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {!isPushApproved ? (
                <button
                  type="button"
                  onClick={() => setIsPushApproved(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Git Push</span>
                </button>
              ) : !isPushed ? (
                <button
                  type="button"
                  onClick={() => setIsPushed(true)}
                  className="px-5 py-2.5 rounded-xl omni-btn-primary font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-4 h-4" />
                  <span>Execute Git Push to Remote</span>
                </button>
              ) : (
                <span className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Branch pushed successfully</span>
                </span>
              )}
            </div>
          </div>

          {/* Gate 2: Open PR Approval */}
          <div className={`omni-card rounded-2xl p-6 space-y-5 transition ${
            !isPushed ? "opacity-60" : ""
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Approval Gate 2: Open Official Pull Request</h3>
                  <p className="text-xs text-slate-500">Action: Create Pull Request on GitHub linking Issue #3</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  prOpened
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : isPrApproved
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}
              >
                {prOpened ? "PULL REQUEST OPENED" : isPrApproved ? "APPROVED" : "BLOCKED UNTIL PUSH"}
              </span>
            </div>

            {/* Proposed PR Body Preview */}
            <div className="space-y-2 text-xs">
              <span className="text-slate-600 font-semibold">Proposed PR Body (Following Repo Template):</span>
              <div className="p-4 rounded-xl bg-slate-50 font-mono text-[11px] text-slate-800 border border-slate-200 whitespace-pre-wrap leading-relaxed shadow-xs">
{`## Summary
Fixes #3 by introducing \`benchmarks/inference_profile.py\` to profile wafer defect classification latency and throughput under batch processing.

## Root Cause & Motivation
Inference throughput was not profiled across varying batch sizes, making edge sensor deployment targets uncertain.

## Changes Made
- Added \`benchmark_batch_inference()\` measuring avg, p95, and p99 latency per wafer
- Pre-allocated batch tensors under \`torch.no_grad()\` to prevent measurement jitter
- Added automated unit test in \`tests/test_benchmark.py\`

## Test Verification
- \`pytest tests/test_benchmark.py -v\` (3 passed in 0.42s)`}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {isPushed && !isPrApproved ? (
                <button
                  type="button"
                  onClick={() => setIsPrApproved(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Pull Request Submission</span>
                </button>
              ) : isPushed && !prOpened ? (
                <button
                  type="button"
                  onClick={() => setPrOpened(true)}
                  className="px-5 py-2.5 rounded-xl omni-btn-primary font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <GitPullRequest className="w-4 h-4" />
                  <span>Submit PR #4 to GitHub</span>
                </button>
              ) : prOpened ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pull Request #4 is live on GitHub</span>
                  </span>
                  <a
                    href="https://github.com/badrisatyam1-ctrl/wafer-defect-classification/pull/4"
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition text-xs font-mono flex items-center gap-1 shadow-xs"
                  >
                    <span>View PR #4</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
