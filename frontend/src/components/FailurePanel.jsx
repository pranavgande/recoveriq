import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, GitFork, TimerReset, Zap } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

const scenarios = [
  {
    key: "concurrent",
    icon: GitFork,
    title: "Concurrent webhooks",
    proof: "Atomic UPSERT elects one winner.",
    action: api.failure.concurrent,
    testId: "trigger-concurrent",
  },
  {
    key: "stale",
    icon: TimerReset,
    title: "Stale reservation",
    proof: "Crashed worker safely degrades.",
    action: api.failure.stale,
    testId: "trigger-stale",
  },
  {
    key: "duplicate",
    icon: Copy,
    title: "Duplicate executor",
    proof: "Persistent PK blocks a second write.",
    action: api.failure.duplicate,
    testId: "trigger-duplicate",
  },
];

export default function FailurePanel({ onScenarioComplete }) {
  const [busyKey, setBusyKey] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const run = async (scenario) => {
    setBusyKey(scenario.key);
    try {
      const result = await scenario.action();
      setLastResult({ scenario: scenario.title, ...result });
      toast.success("Control proven", { description: result.explanation });
      onScenarioComplete?.();
    } catch {
      toast.error(`Failed: ${scenario.title}`);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white"
      data-testid="failure-panel"
    >
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
          <Zap size={12} className="text-[#3395FF]" />
          Live controls
        </div>
        <h3 className="mt-1 font-heading text-lg font-black text-[#0D2366]">
          Prove the safety layer
        </h3>
        <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-slate-400">
          Run scripted resilience scenarios against the same persistent state used by
          the recovery pipeline.
        </p>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-3">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          const busy = busyKey === scenario.key;
          return (
            <motion.button
              key={scenario.key}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => run(scenario)}
              disabled={busy}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50/40 disabled:cursor-wait disabled:opacity-60"
              data-testid={scenario.testId}
            >
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0D2366] shadow-sm ring-1 ring-slate-200">
                  <Icon size={15} />
                </div>
                {busy && (
                  <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-600">
                    Running
                  </span>
                )}
              </div>

              <div className="mt-4 text-xs font-bold text-[#0D2366]">
                {scenario.title}
              </div>
              <div className="mt-1 text-[10px] leading-relaxed text-slate-500">
                {scenario.proof}
              </div>
            </motion.button>
          );
        })}
      </div>

      {lastResult && (
        <div className="border-t border-slate-200 px-5 py-4" data-testid="scenario-output">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-600">
            <CheckCircle2 size={12} />
            Latest control result
          </div>
          <div className="mt-2 text-xs font-semibold text-[#0D2366]">
            {lastResult.scenario}
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            {lastResult.explanation}
          </p>
          <pre className="mt-3 max-h-36 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-[9px] leading-relaxed text-slate-200 scroll-thin">
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
