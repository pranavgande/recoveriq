import React from "react";
import {
  Brain,
  ShieldCheck,
  Rocket,
  GitFork,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCode,
  Lock,
  Zap,
} from "lucide-react";
import { fmtINR, fmtINRRaw } from "@/lib/api";

export default function RecoveryPipeline({
  selectedEvent,
  pipelineResult,
  running,
  onRunPipeline,
}) {
  if (!selectedEvent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-[#0f1422]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 mb-3">
          <GitFork size={24} />
        </div>
        <h4 className="font-heading text-base font-bold text-slate-900 dark:text-white">
          No Event Selected
        </h4>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Select any payment from the live activity stream or payment events list to inspect its 4-stage recovery pipeline.
        </p>
      </div>
    );
  }

  const diagnosis = pipelineResult?.diagnosis;
  const decision = pipelineResult?.decision;
  const execution = pipelineResult?.execution;
  const workflow = pipelineResult?.workflow;
  const risk = pipelineResult?.risk;
  const customer = pipelineResult?.customer_context;

  // Stepper state checks
  const stage1Complete = Boolean(diagnosis);
  const stage2Complete = Boolean(decision);
  const stage3Complete = Boolean(execution);
  const stage4Complete = Boolean(workflow);

  return (
    <div className="space-y-6">
      {/* Event Header Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <Zap size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-base font-bold text-slate-900 dark:text-white">
                Payment {selectedEvent.event_id?.slice(0, 12)}...
              </span>
              <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold font-mono-ui text-rose-500">
                {selectedEvent.failure_code || "FAILED"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Merchant: {selectedEvent._raw?.merchant_id || "M_DEFAULT"} • Bank: {selectedEvent.bank || "UPI"} • Method: {selectedEvent.method || "CARD"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400">Transaction Value</div>
            <div className="font-heading text-lg font-black font-mono-ui text-slate-900 dark:text-white">
              {fmtINR(selectedEvent.amount_paise, true)}
            </div>
          </div>
          <button
            onClick={() => onRunPipeline(selectedEvent)}
            disabled={running}
            className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-600/20 disabled:opacity-50 transition-all"
          >
            {running ? "Processing Stages..." : "Execute Pipeline"}
          </button>
        </div>
      </div>

      {/* 4-Stage Horizontal Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* STAGE 01: AI Diagnosis */}
        <div
          className={`relative rounded-2xl border p-5 transition-all ${
            stage1Complete
              ? "border-violet-500/30 bg-violet-500/5 dark:bg-violet-950/20"
              : "border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] opacity-75"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500 font-mono-ui">
              01 • AI Diagnosis
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <Brain size={16} />
            </div>
          </div>

          <div className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">
            {stage1Complete ? diagnosis.diagnosis_class : "Awaiting analysis..."}
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
            {stage1Complete
              ? diagnosis.evidence_summary
              : "Gemini 2.5 Flash analyzes context for bank degradation or transient errors."}
          </p>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Confidence</span>
            <span className="font-bold font-mono-ui text-emerald-500">
              {stage1Complete ? `${Math.round(diagnosis.confidence * 100)}%` : "—"}
            </span>
          </div>
        </div>

        {/* STAGE 02: Policy Gate */}
        <div
          className={`relative rounded-2xl border p-5 transition-all ${
            stage2Complete
              ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20"
              : "border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] opacity-75"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 font-mono-ui">
              02 • Policy Gate
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <ShieldCheck size={16} />
            </div>
          </div>

          <div className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">
            {stage2Complete ? decision.final_action : "Awaiting evaluation..."}
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
            {stage2Complete
              ? decision.reason
              : "Deterministic idempotency lock, retry limits, and safety verification."}
          </p>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">All Gates Passed</span>
            <span className="font-bold font-mono-ui text-emerald-500">
              {stage2Complete ? "VERIFIED" : "—"}
            </span>
          </div>
        </div>

        {/* STAGE 03: Execution */}
        <div
          className={`relative rounded-2xl border p-5 transition-all ${
            stage3Complete
              ? "border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/20"
              : "border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] opacity-75"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 font-mono-ui">
              03 • Execution
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Rocket size={16} />
            </div>
          </div>

          <div className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">
            {stage3Complete ? execution.outcome : "Awaiting execution..."}
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
            {stage3Complete
              ? `Gateway Ref: ${execution.razorpay_ref || "Internal Safe Mock"}`
              : "Razorpay SDK atomic invocation with mutual idempotency token."}
          </p>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Latency</span>
            <span className="font-bold font-mono-ui text-slate-700 dark:text-slate-300">
              {stage3Complete ? `${execution.latency_ms}ms` : "—"}
            </span>
          </div>
        </div>

        {/* STAGE 04: Recovery Workflow */}
        <div
          className={`relative rounded-2xl border p-5 transition-all ${
            stage4Complete
              ? "border-violet-500/30 bg-violet-500/5 dark:bg-violet-950/20"
              : "border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] opacity-75"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500 font-mono-ui">
              04 • Recovery Workflow
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <GitFork size={16} />
            </div>
          </div>

          <div className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">
            {stage4Complete ? `Status: ${workflow.status}` : "Awaiting workflow..."}
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
            {stage4Complete
              ? `Next Action: ${workflow.next_action || "TERMINATED"}`
              : "Multi-step lifecycle tracking: SMART_RETRY → LINK → ESCALATION."}
          </p>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Recovered Value</span>
            <span className="font-bold font-mono-ui text-emerald-500">
              {stage4Complete ? fmtINRRaw(workflow.total_recovered_amount) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Contextual Detail Grid (Risk + Customer Profile + Workflow Actions) */}
      {pipelineResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Revenue Risk Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Revenue-at-Risk Assessment
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-500">
                Deterministic
              </span>
            </div>
            {risk ? (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Risk Score</span>
                  <span className="font-heading text-2xl font-black text-slate-900 dark:text-white">
                    {risk.risk_score}/100
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Risk Level</span>
                  <span className="font-bold font-mono-ui text-rose-500">
                    {risk.risk_level}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Est. Recoverable</span>
                  <span className="font-bold font-mono-ui text-emerald-500">
                    {fmtINRRaw(risk.estimated_recoverable_amount)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {risk.explanation}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Risk scoring pending execution.</p>
            )}
          </div>

          {/* Customer Context Card */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Customer Context
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                Profile Store
              </span>
            </div>
            {customer ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Customer ID</span>
                  <span className="font-mono-ui font-bold text-slate-800 dark:text-slate-200">
                    {customer.customer_id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Customer Tier</span>
                  <span className="font-bold text-violet-500">
                    {customer.customer_tier}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Historical Success</span>
                  <span className="font-mono-ui font-bold text-emerald-500">
                    {Math.round(customer.historical_success_rate * 100)}% ({customer.total_successful_payments} succ / {customer.total_failed_payments} fail)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Recommended Strategy</span>
                  <span className="font-mono-ui font-bold text-violet-400">
                    {pipelineResult.recommended_strategy || "SMART_RETRY"}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Customer context pending execution.</p>
            )}
          </div>

          {/* Workflow Stepper History */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Workflow Actions Taken
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-mono-ui">
                WF #{workflow?.workflow_id || "NEW"}
              </span>
            </div>
            {workflow?.actions_taken?.length ? (
              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                {workflow.actions_taken.map((act, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="font-mono-ui text-violet-400">
                        Step {act.step_number}: {act.action}
                      </span>
                      <span
                        className={`text-[10px] ${
                          act.result === "SUCCESS"
                            ? "text-emerald-500"
                            : "text-amber-500"
                        }`}
                      >
                        {act.result}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{act.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Workflow sequence starts automatically on first recovery invocation.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
