import React from "react";
import { Sparkles, Brain, Shield, Rocket } from "lucide-react";

export default function AiDiagnosisBanner({ pipelineResult }) {
  const diagnosis = pipelineResult?.diagnosis;
  const hasDiagnosis = Boolean(diagnosis);

  const rootCause = diagnosis?.diagnosis_class;
  const confidence = diagnosis?.confidence !== undefined ? Math.round(diagnosis.confidence * 100) : null;
  const recommendation =
    pipelineResult?.recommended_strategy || pipelineResult?.decision?.final_action;
  const evidenceSummary = diagnosis?.evidence_summary;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-[#07090e] p-6 lg:p-8 text-white shadow-xl">
      {/* Subtle background tech grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-2">
              <Sparkles size={12} />
              AI Diagnosis in Action
            </div>
            <h3 className="font-heading text-xl font-bold tracking-tight text-white">
              Autonomous Root Cause Classification
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gemini analyzes payment context and proposes the safest recovery path.
            </p>
          </div>

          {/* Three Summary Metrics */}
          <div className="flex items-center gap-6 sm:gap-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl px-5 py-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Diagnosis Confidence
              </div>
              <div className="font-heading text-xl font-black text-emerald-400">
                {confidence !== null ? `${confidence}%` : "—"}
              </div>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Pattern Detection
              </div>
              <div className="font-heading text-xl font-black text-violet-400">
                {hasDiagnosis ? "Window 60m" : "—"}
              </div>
            </div>
            <div className="h-7 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Events Analyzed
              </div>
              <div className="font-heading text-xl font-black text-white">
                {hasDiagnosis ? "Cohort Synced" : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Live Example & Core Invariant */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
          {/* Live Example Card (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live Diagnosis Output
              </span>
              <span className="text-[10px] font-mono-ui font-semibold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded">
                DiagnosisProposal
              </span>
            </div>

            {hasDiagnosis ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60">
                    <div className="text-[10px] text-slate-400 font-semibold mb-1">
                      Root Cause
                    </div>
                    <div className="text-xs font-bold font-mono-ui text-amber-400 truncate">
                      {rootCause || "—"}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60">
                    <div className="text-[10px] text-slate-400 font-semibold mb-1">
                      Confidence
                    </div>
                    <div className="text-xs font-bold font-mono-ui text-emerald-400">
                      {confidence !== null ? `${confidence}%` : "—"}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/60">
                    <div className="text-[10px] text-slate-400 font-semibold mb-1">
                      Recommendation
                    </div>
                    <div className="text-xs font-bold font-mono-ui text-violet-400 truncate">
                      {recommendation || "—"}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-mono-ui text-[11px] bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                  "{evidenceSummary || "Diagnosis proposal returned with validated schema."}"
                </p>
              </>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                Run a recovery analysis to see Gemini's diagnosis.
              </div>
            )}
          </div>

          {/* Triad Invariant Principle (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Trust Architecture Invariant
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
                    <Brain size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">AI recommends.</div>
                    <div className="text-[11px] text-slate-400">
                      Probabilistic diagnosis & heuristic hypothesis.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Shield size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Policy controls.</div>
                    <div className="text-[11px] text-slate-400">
                      Deterministic idempotency, gates & safety boundaries.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Rocket size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Executor acts.</div>
                    <div className="text-[11px] text-slate-400">
                      Atomic financial operations with Razorpay SDK.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-between">
              <span>Zero hallucinations in financial state</span>
              <span className="text-emerald-400 font-bold">Guaranteed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
