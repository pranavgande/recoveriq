import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  ShieldCheck,
  Rocket,
  ChevronRight,
  CircleCheck,
  CircleX,
  TriangleAlert,
  Gauge,
  UserCheck,
  Zap,
  GitFork,
} from "lucide-react";
import { fmtINR, shortId } from "../lib/api";

const decisionStyle = {
  RETRY: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30",
  OFFER_ALTERNATE_METHOD: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
  STOP_AND_ESCALATE: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30",
};

const outcomeIcon = {
  SUCCESS: <CircleCheck size={16} className="text-[#10B981]" />,
  ESCALATED: <TriangleAlert size={16} className="text-[#EF4444]" />,
  DUPLICATE_BLOCKED: <ShieldCheck size={16} className="text-[#3395FF]" />,
  SDK_ERROR: <CircleX size={16} className="text-[#EF4444]" />,
};

const Stage = ({ index, active, title, icon: Icon, children, testId }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08 }}
    className={`relative rounded-2xl p-5 border ${
      active
        ? "border-transparent bg-white tracing-border"
        : "border-[#E2E8F0] bg-white"
    }`}
    data-testid={testId}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            active ? "bg-[#3395FF] text-white" : "bg-[#F1F5F9] text-[#0D2366]"
          }`}
        >
          <Icon size={18} />
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-[0.22em] text-[#94A3B8] uppercase">
            Stage {index + 1}
          </div>
          <h4 className="text-base font-heading font-bold text-[#0D2366]">
            {title}
          </h4>
        </div>
      </div>
      {active && (
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#3395FF]">
          Processing
        </span>
      )}
    </div>
    {children}
  </motion.div>
);

function ConfidenceBar({ value }) {
  const pct = Math.round((value || 0) * 100);
  const good = value >= 0.6;
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-[#94A3B8]">Confidence</span>
        <span
          className={`font-mono-ui font-bold ${good ? "text-[#10B981]" : "text-[#EF4444]"}`}
        >
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className={`h-full rounded-full ${good ? "bg-[#10B981]" : "bg-[#EF4444]"}`}
        />
      </div>
    </div>
  );
}

export default function PipelineViz({ selected, result, running }) {
  const diag = result?.diagnosis;
  const decision = result?.decision;
  const execution = result?.execution;
  const risk = result?.risk;

  const riskBadgeStyle = {
    HIGH: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30",
    MEDIUM: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
    LOW: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30",
  };

  return (
    <section
      className="bg-white border border-[#E2E8F0] rounded-2xl p-6 h-full"
      data-testid="pipeline-viz"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] font-bold tracking-[0.22em] text-[#3395FF] uppercase">
            Recovery Pipeline
          </div>
          <h3 className="text-xl font-heading font-bold text-[#0D2366]">
            {selected
              ? `Processing ${shortId(selected.event_id, 18)}`
              : "Select an event to inspect"}
          </h3>
          {selected && (
            <p className="text-sm text-[#4B5563] mt-1">
              <span className="font-mono-ui">
                {selected.method?.toUpperCase()}
              </span>{" "}
              · {selected.bank} · {fmtINR(selected.amount_paise)} ·{" "}
              <span className="text-[#EF4444]">{selected.failure_code}</span>
            </p>
          )}
        </div>
        {running && (
          <div className="flex items-center gap-2 text-[#3395FF] text-xs font-bold">
            <span className="pulse-dot inline-block w-2 h-2 rounded-full bg-[#3395FF]" />
            LIVE
          </div>
        )}
      </div>

      {risk && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
          data-testid="revenue-risk-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gauge size={18} className="text-[#0D2366]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D2366]">
                Revenue-at-Risk Score
              </span>
              <span
                className={`text-[10px] font-bold tracking-[0.16em] uppercase px-2.5 py-0.5 rounded-full border ${
                  riskBadgeStyle[risk.risk_level] || "bg-gray-100 text-gray-700"
                }`}
              >
                {risk.risk_level} RISK
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-[#94A3B8]">Risk Score: </span>
                <span className="font-mono-ui font-bold text-[#0D2366]">
                  {risk.risk_score} / 100
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8]">Est. Recoverable: </span>
                <span className="font-mono-ui font-bold text-[#10B981]">
                  ₹{Number(risk.estimated_recoverable_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-[#4B5563] leading-relaxed">
            {risk.explanation}
          </p>
        </motion.div>
      )}

      {(result?.customer_context || result?.recommended_strategy) && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 p-4 rounded-xl border border-[#3395FF]/20 bg-[#3395FF]/5"
          data-testid="customer-context-card"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result?.customer_context && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0D2366]">
                  <UserCheck size={16} className="text-[#3395FF]" />
                  <span>Customer Profile: {result.customer_context.customer_id}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#E2E8F0] text-[#0D2366] font-mono-ui">
                    {result.customer_context.customer_tier}
                  </span>
                </div>
                <div className="mt-2 text-xs text-[#4B5563] space-y-1">
                  <div>
                    Success History:{" "}
                    <span className="font-mono-ui font-bold text-[#10B981]">
                      {Math.round(result.customer_context.historical_success_rate * 100)}%
                    </span>{" "}
                    ({result.customer_context.total_successful_payments} succ / {result.customer_context.total_failed_payments} fail)
                  </div>
                  <div>
                    Avg Transaction:{" "}
                    <span className="font-mono-ui font-bold text-[#0D2366]">
                      ₹{Number(result.customer_context.average_transaction_value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {result?.recommended_strategy && (
              <div className="border-t md:border-t-0 md:border-l border-[#3395FF]/20 pt-3 md:pt-0 md:pl-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0D2366]">
                  <Zap size={16} className="text-[#F59E0B]" />
                  <span>Smart Recovery Recommendation</span>
                </div>
                <div className="mt-2">
                  <span className="inline-block text-[11px] font-bold tracking-[0.16em] uppercase px-2.5 py-0.5 rounded-full bg-[#0D2366] text-white">
                    {result.recommended_strategy.replace(/_/g, " ")}
                  </span>
                  <p className="mt-1.5 text-xs text-[#4B5563] leading-relaxed">
                    {result.strategy_reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Stage
          index={0}
          active={running && !diag}
          title="LLM Diagnosis"
          icon={Brain}
          testId="stage-llm"
        >
          <AnimatePresence mode="wait">
            {diag ? (
              <motion.div
                key="d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-xs text-[#94A3B8] uppercase tracking-wider">
                  Root cause
                </div>
                <div className="text-sm font-semibold text-[#0D2366]">
                  {diag.diagnosis_class}
                </div>
                <div className="mt-2 text-xs text-[#4B5563] leading-relaxed">
                  {diag.evidence_summary}
                </div>
                <ConfidenceBar value={diag.confidence} />
              </motion.div>
            ) : (
              <div className="text-sm text-[#94A3B8]">Awaiting diagnosis…</div>
            )}
          </AnimatePresence>
        </Stage>

        <Stage
          index={1}
          active={running && diag && !decision}
          title="Policy Gate"
          icon={ShieldCheck}
          testId="stage-policy"
        >
          {decision ? (
            <div>
              <div
                className={`inline-block text-[11px] font-bold tracking-[0.16em] uppercase px-3 py-1 rounded-full border ${decisionStyle[decision.final_action]}`}
              >
                {(decision?.final_action || "UNKNOWN").replace(/_/g, " ")}
              </div>
              <div className="mt-3 text-xs text-[#4B5563]">
                {decision.reason}
              </div>
              <div className="mt-3 space-y-1">
                {Object.entries(decision.gates).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between text-[11px] font-mono-ui"
                  >
                    <span className="text-[#0D2366]">{k}</span>
                    {v ? (
                      <CircleCheck size={13} className="text-[#10B981]" />
                    ) : (
                      <CircleX size={13} className="text-[#EF4444]" />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-[10px] font-mono-ui text-[#94A3B8]">
                reservation: {shortId(decision.reservation_id, 22)}
              </div>
            </div>
          ) : (
            <div className="text-sm text-[#94A3B8]">Awaiting policy gate…</div>
          )}
        </Stage>

        <Stage
          index={2}
          active={running && decision && !execution}
          title="Razorpay Executor"
          icon={Rocket}
          testId="stage-executor"
        >
          {execution ? (
            <div>
              <div className="flex items-center gap-2">
                {outcomeIcon[execution.outcome] || (
                  <CircleCheck size={16} className="text-[#0D2366]" />
                )}
                <span className="text-sm font-bold text-[#0D2366]">
                  {(execution?.outcome || "PENDING").replace(/_/g, " ")}
                </span>
              </div>
              {execution.razorpay_ref && (
                <div className="mt-2 text-[10px] font-mono-ui text-[#4B5563] break-all">
                  ref: {execution.razorpay_ref}
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#F8FAFC] rounded-md p-2">
                  <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">
                    Latency
                  </div>
                  <div className="font-mono-ui font-bold text-[#0D2366]">
                    {execution.latency_ms} ms
                  </div>
                </div>
                <div className="bg-[#F8FAFC] rounded-md p-2">
                  <div className="text-[10px] text-[#94A3B8] uppercase tracking-wider">
                    Duplicate
                  </div>
                  <div className="font-mono-ui font-bold text-[#0D2366]">
                    {execution.duplicate_blocked ? "BLOCKED" : "NO"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-[#94A3B8]">Awaiting executor…</div>
          )}
        </Stage>
      </div>

      {result?.workflow && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
          data-testid="workflow-history-card"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <GitFork size={16} className="text-[#0D2366]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0D2366]">
                Recovery Workflow
              </span>
              <span
                className={`text-[10px] font-bold tracking-[0.16em] uppercase px-2 py-0.5 rounded-full border ${
                  result.workflow.status === "RECOVERED"
                    ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30"
                    : result.workflow.status === "STOPPED"
                    ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
                    : result.workflow.status === "ESCALATED"
                    ? "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30"
                    : result.workflow.status === "EXHAUSTED"
                    ? "bg-[#94A3B8]/10 text-[#94A3B8] border-[#94A3B8]/30"
                    : "bg-[#3395FF]/10 text-[#3395FF] border-[#3395FF]/30"
                }`}
              >
                {result.workflow.status}
              </span>
            </div>
            <span className="text-[10px] font-mono-ui text-[#94A3B8]">
              {result.workflow.workflow_id}
            </span>
          </div>

          {/* Steps stepper */}
          {result.workflow.actions_taken && result.workflow.actions_taken.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1 mb-3">
              {result.workflow.actions_taken.map((action, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex flex-col items-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        action.result === "SUCCESS"
                          ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30"
                          : action.result === "STOPPED"
                          ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
                          : action.result === "DISPATCHED"
                          ? "bg-[#3395FF]/10 text-[#3395FF] border-[#3395FF]/30"
                          : "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30"
                      }`}
                    >
                      Step {action.step_number}: {action.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-[9px] text-[#94A3B8] mt-0.5">{action.result}</span>
                  </div>
                  {idx < result.workflow.actions_taken.length - 1 && (
                    <ChevronRight size={12} className="text-[#94A3B8] flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
              {result.workflow.next_action && (
                <>
                  <ChevronRight size={12} className="text-[#94A3B8] flex-shrink-0" />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-dashed border-[#3395FF]/40 text-[#3395FF]">
                    Next: {result.workflow.next_action.replace(/_/g, " ")}
                  </span>
                </>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#94A3B8] mb-2">No actions recorded yet.</p>
          )}

          {/* Summary row */}
          <div className="flex flex-wrap gap-4 text-xs text-[#4B5563]">
            <span>
              Step:{" "}
              <span className="font-mono-ui font-bold text-[#0D2366]">
                {result.workflow.current_step}
              </span>
            </span>
            {result.workflow.total_recovered_amount > 0 && (
              <span>
                Recovered:{" "}
                <span className="font-mono-ui font-bold text-[#10B981]">
                  ₹{Number(result.workflow.total_recovered_amount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </span>
            )}
          </div>
        </motion.div>
      )}

      {result?.trace && (
        <div className="mt-6">
          <div className="text-[10px] font-bold tracking-[0.22em] text-[#94A3B8] uppercase mb-2">
            Trace
          </div>
          <div className="space-y-1 font-mono-ui text-[11px]">
            {result.trace.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 text-[#4B5563]"
              >
                <ChevronRight
                  size={12}
                  className="text-[#3395FF] mt-0.5 flex-shrink-0"
                />
                <span className="text-[#0D2366] font-bold w-20 flex-shrink-0">
                  {t.stage}
                </span>
                <span>{t.message}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

