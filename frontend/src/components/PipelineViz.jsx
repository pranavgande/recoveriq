import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Brain,
  CircleCheck,
  CircleX,
  Clock3,
  Gauge,
  GitBranch,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { fmtINR, shortId } from "../lib/api";

const riskStyles = {
  HIGH: "bg-red-50 text-red-700 border-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const actionStyles = {
  RETRY: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OFFER_ALTERNATE_METHOD: "bg-amber-50 text-amber-700 border-amber-200",
  STOP_AND_ESCALATE: "bg-red-50 text-red-700 border-red-200",
  NO_ACTION: "bg-slate-100 text-slate-600 border-slate-200",
};

const statusStyles = {
  RECOVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ESCALATED: "bg-amber-50 text-amber-700 border-amber-200",
  STOPPED: "bg-red-50 text-red-700 border-red-200",
  EXHAUSTED: "bg-slate-100 text-slate-600 border-slate-200",
  ACTIVE: "bg-blue-50 text-blue-700 border-blue-200",
};

function pretty(value) {
  return (value || "UNKNOWN").replace(/_/g, " ");
}

function amount(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Label({ children }) {
  return (
    <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
      {children}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon size={12} />
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </span>
      </div>
      <div className="mt-2 font-mono text-sm font-bold text-[#0D2366]">{value}</div>
    </div>
  );
}

function Stage({
  number,
  title,
  icon: Icon,
  active,
  complete,
  children,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${
        active
          ? "border-blue-300 bg-blue-50/30"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              complete
                ? "bg-emerald-50 text-emerald-600"
                : active
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            <Icon size={15} />
          </div>

          <div>
            <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Step {number}
            </div>
            <div className="font-heading text-sm font-black text-[#0D2366]">
              {title}
            </div>
          </div>
        </div>

        {complete && <CircleCheck size={14} className="text-emerald-500" />}
        {active && (
          <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-blue-600">
            Live
          </span>
        )}
      </div>

      <div className="mt-4">{children}</div>
    </motion.div>
  );
}

export default function PipelineViz({ selected, result, running }) {
  const diagnosis = result?.diagnosis;
  const risk = result?.risk;
  const customer = result?.customer_context;
  const decision = result?.decision;
  const execution = result?.execution;
  const workflow = result?.workflow;

  const amountLabel = selected ? fmtINR(selected.amount_paise) : "₹0";

  if (!result) {
    return (
      <section
        className="flex min-h-[760px] items-center justify-center rounded-2xl border border-slate-200 bg-white"
        data-testid="pipeline-viz"
      >
        <div className="max-w-sm px-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <GitBranch size={24} />
          </div>
          <h3 className="mt-5 font-heading text-xl font-black text-[#0D2366]">
            Recovery decision center
          </h3>
          <p className="mt-2 text-xs leading-6 text-slate-400">
            Choose a failed payment to see revenue risk, customer context,
            AI diagnosis, policy approval, and the recovery action.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
      data-testid="pipeline-viz"
    >
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Label>Recovery decision center</Label>
            <h3 className="mt-1.5 font-heading text-2xl font-black tracking-tight text-[#0D2366]">
              {selected ? `Payment ${shortId(selected.event_id, 17)}` : "Payment"}
            </h3>
            {selected && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span className="font-mono font-semibold text-[#0D2366]">
                  {selected.method?.toUpperCase()}
                </span>
                <span>•</span>
                <span>{selected.bank || "Unknown bank"}</span>
                <span>•</span>
                <span className="font-mono font-semibold text-[#0D2366]">
                  {amountLabel}
                </span>
                <span>•</span>
                <span className="font-semibold text-red-600">
                  {selected.failure_code || "UNKNOWN"}
                </span>
              </div>
            )}
          </div>

          {running && (
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-blue-600">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-blue-600" />
              Processing
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <MiniStat
            icon={IndianRupee}
            label="Payment value"
            value={amountLabel}
          />
          <MiniStat
            icon={Gauge}
            label="Revenue risk"
            value={risk ? `${risk.risk_score}/100` : "—"}
            tone={risk?.risk_level === "HIGH" ? "red" : risk?.risk_level === "MEDIUM" ? "amber" : "green"}
          />
          <MiniStat
            icon={IndianRupee}
            label="Est. recovery"
            value={risk ? amount(risk.estimated_recoverable_amount) : "—"}
            tone="green"
          />
        </div>

        {risk && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Label>Revenue at risk</Label>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="font-heading text-4xl font-black tracking-tight text-[#0D2366]">
                    {risk.risk_score}
                  </div>
                  <div className="text-sm text-slate-400">/100</div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                      riskStyles[risk.risk_level] || riskStyles.LOW
                    }`}
                  >
                    {risk.risk_level} risk
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <Label>Expected recovery</Label>
                <div className="mt-1 font-heading text-xl font-black text-emerald-600">
                  {amount(risk.estimated_recoverable_amount)}
                </div>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Number(risk.risk_score) || 0, 100)}%` }}
                transition={{ duration: 0.7 }}
                className={`h-full rounded-full ${
                  risk.risk_level === "HIGH"
                    ? "bg-red-500"
                    : risk.risk_level === "MEDIUM"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
              />
            </div>

            <p className="mt-3 text-[11px] leading-5 text-slate-500">
              {risk.explanation}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {customer && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <UserCheck size={15} className="text-blue-600" />
                <Label>Customer context</Label>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-[#0D2366]">
                  {customer.customer_id}
                </span>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-blue-700">
                  {customer.customer_tier}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <MiniStat
                  icon={CircleCheck}
                  label="Success"
                  value={`${Math.round(customer.historical_success_rate * 100)}%`}
                  tone="green"
                />
                <MiniStat
                  icon={IndianRupee}
                  label="Avg payment"
                  value={amount(customer.average_transaction_value)}
                />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-500" />
              <Label>AI recommendation</Label>
            </div>

            <div className="mt-3">
              <div className="text-[9px] uppercase tracking-[0.14em] text-slate-400">
                Proposed strategy
              </div>
              <div className="mt-1.5 inline-flex rounded-full bg-[#0D2366] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white">
                {pretty(result.recommended_strategy)}
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-5 text-slate-500">
              {result.strategy_reason}
            </p>

            {decision?.final_action && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Policy-approved
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.11em] ${
                      actionStyles[decision.final_action] || actionStyles.NO_ACTION
                    }`}
                  >
                    {pretty(decision.final_action)}
                  </span>
                  <ArrowRight size={12} className="text-slate-300" />
                  <span className="text-[10px] font-semibold text-[#0D2366]">
                    executor follows policy
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#3395FF]" />
              <Label>Decision flow</Label>
            </div>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-slate-400">
              AI → policy → execution
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Stage
              number="01"
              title="Diagnosis"
              icon={Brain}
              active={running && !diagnosis}
              complete={!!diagnosis}
            >
              {diagnosis ? (
                <>
                  <Label>Root cause</Label>
                  <div className="mt-1 text-sm font-bold text-[#0D2366]">
                    {diagnosis.diagnosis_class}
                  </div>
                  <p className="mt-2 text-[10px] leading-5 text-slate-500">
                    {diagnosis.evidence_summary}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[9px] font-semibold text-slate-400">
                    <span>Confidence</span>
                    <span className="font-mono text-emerald-600">
                      {Math.round((diagnosis.confidence || 0) * 100)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.round((diagnosis.confidence || 0) * 100)}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400">Waiting for AI diagnosis…</div>
              )}
            </Stage>

            <Stage
              number="02"
              title="Policy gate"
              icon={ShieldCheck}
              active={running && !!diagnosis && !decision}
              complete={!!decision}
            >
              {decision ? (
                <>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] ${
                      actionStyles[decision.final_action] || actionStyles.NO_ACTION
                    }`}
                  >
                    {pretty(decision.final_action)}
                  </span>
                  <p className="mt-2 text-[10px] leading-5 text-slate-500">
                    {decision.reason}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    {Object.entries(decision.gates || {}).map(([key, ok]) => (
                      <div key={key} className="flex items-center justify-between text-[9px]">
                        <span className="font-mono text-slate-500">{key}</span>
                        {ok ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CircleCheck size={11} /> PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <CircleX size={11} /> BLOCK
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400">Waiting for policy decision…</div>
              )}
            </Stage>

            <Stage
              number="03"
              title="Execution"
              icon={ArrowRight}
              active={running && !!decision && !execution}
              complete={!!execution}
            >
              {execution ? (
                <>
                  <div className="flex items-center gap-2">
                    {execution.outcome === "DUPLICATE_BLOCKED" ? (
                      <ShieldCheck size={15} className="text-blue-600" />
                    ) : execution.outcome === "SDK_ERROR" ? (
                      <CircleX size={15} className="text-red-600" />
                    ) : (
                      <CircleCheck size={15} className="text-emerald-600" />
                    )}
                    <span className="text-sm font-bold text-[#0D2366]">
                      {pretty(execution.outcome)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MiniStat
                      icon={Clock3}
                      label="Latency"
                      value={`${execution.latency_ms ?? 0} ms`}
                    />
                    <MiniStat
                      icon={ShieldCheck}
                      label="Duplicate"
                      value={execution.duplicate_blocked ? "BLOCKED" : "NO"}
                      tone={execution.duplicate_blocked ? "blue" : "green"}
                    />
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400">Waiting for approved execution…</div>
              )}
            </Stage>
          </div>
        </div>

        {workflow && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <GitBranch size={14} className="text-[#3395FF]" />
                <Label>Recovery workflow</Label>
                <span
                  className={`rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-[0.11em] ${
                    statusStyles[workflow.status] || statusStyles.ACTIVE
                  }`}
                >
                  {workflow.status}
                </span>
              </div>
              <span className="font-mono text-[8px] text-slate-400">
                {workflow.workflow_id}
              </span>
            </div>

            <div className="mt-4 flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
              {workflow.actions_taken?.map((action, index) => (
                <React.Fragment key={`${action.step_number}-${index}`}>
                  <div className="min-w-[145px] rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[8px] uppercase tracking-[0.12em] text-slate-400">
                      Step {action.step_number}
                    </div>
                    <div className="mt-1 text-[10px] font-bold text-[#0D2366]">
                      {pretty(action.action)}
                    </div>
                    <div className="mt-2 text-[8px] font-semibold text-slate-400">
                      {action.result}
                    </div>
                  </div>
                  {index < workflow.actions_taken.length - 1 && (
                    <ArrowRight size={13} className="shrink-0 text-slate-300" />
                  )}
                </React.Fragment>
              ))}

              {workflow.next_action && (
                <>
                  <ArrowRight size={13} className="shrink-0 text-slate-300" />
                  <div className="min-w-[145px] rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-3">
                    <div className="text-[8px] uppercase tracking-[0.12em] text-blue-500">
                      Next
                    </div>
                    <div className="mt-1 text-[10px] font-bold text-blue-700">
                      {pretty(workflow.next_action)}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-5 border-t border-slate-100 pt-4 text-[10px] text-slate-500">
              <span>
                Step <strong className="font-mono text-[#0D2366]">{workflow.current_step}</strong>
              </span>
              <span>
                Recovered{" "}
                <strong className="font-mono text-emerald-600">
                  {amount(workflow.total_recovered_amount)}
                </strong>
              </span>
            </div>
          </div>
        )}

        {result.trace && (
          <details className="rounded-2xl border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer list-none px-5 py-3 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
              View decision trace
            </summary>
            <div className="space-y-2 border-t border-slate-200 px-5 py-4">
              {result.trace.map((entry, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[90px_1fr] gap-3 font-mono text-[9px] leading-4"
                >
                  <span className="font-bold text-[#0D2366]">{entry.stage}</span>
                  <span className="text-slate-500">{entry.message}</span>
                </div>
              ))}
            </div>
          </details>
        )}

        {execution && decision && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#0D2366] px-5 py-4 text-white">
            <div className="mr-auto">
              <div className="text-[8px] font-bold uppercase tracking-[0.16em] text-blue-200">
                Recovery principle
              </div>
              <div className="mt-1 text-sm font-heading font-black">
                AI recommends. Policy controls. Executor acts.
              </div>
            </div>

            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em]">
              {pretty(result.recommended_strategy)}
            </span>
            <ArrowRight size={11} className="text-blue-200" />
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em]">
              {pretty(decision.final_action)}
            </span>
            <ArrowRight size={11} className="text-blue-200" />
            <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-emerald-200">
              {pretty(execution.outcome)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
