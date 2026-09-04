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

  return (
    <section
      className="bg-white border border-[#E2E8F0] rounded-2xl p-6 h-full"
      data-testid="pipeline-viz"
    >
      <div className="flex items-center justify-between mb-5">
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
