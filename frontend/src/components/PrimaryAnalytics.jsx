import React from "react";
import { CheckCircle2, ShieldAlert, ArrowRight, Zap } from "lucide-react";
import { fmtINR, timeAgo } from "@/lib/api";

export default function PrimaryAnalytics({
  events,
  metrics,
  selectedEvent,
  onSelectEvent,
  onRunPipeline,
  running,
}) {
  // 1. Calculate Success vs Recovery breakdown strictly from events
  const total = events?.length || 0;
  const successfulCount = events?.filter((e) => !e.failure_code).length || 0;
  const failedCount = events?.filter((e) => Boolean(e.failure_code)).length || 0;
  
  // Workflows recovered strictly from backend metrics
  const recoveredCount = metrics?.workflow_recovered_count || 0;
  const unrecoveredCount = Math.max(0, failedCount - recoveredCount);

  const successPct = total > 0 ? Math.round((successfulCount / total) * 100) : 0;
  const recoveredPct = total > 0 ? Math.round((recoveredCount / total) * 100) : 0;
  const failedPct = total > 0 ? Math.max(0, 100 - successPct - recoveredPct) : 0;

  // Recovery Rate KPI from backend
  const hasRate = metrics?.workflow_recovery_rate !== undefined && metrics?.workflow_recovery_rate !== null;
  const recoveryRate = hasRate ? metrics.workflow_recovery_rate : (metrics?.success_rate ?? null);

  // Top 6 recent events for Live Activity
  const recentEvents = (events || []).slice(0, 6);

  // Donut circumference calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const validRateNum = typeof recoveryRate === "number" ? recoveryRate : 0;
  const strokeDashoffset = circumference - (validRateNum / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* LEFT: Payment Success vs Recovery Chart (5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] p-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white">
                Payment Success vs Recovery
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Outcome distribution across gateway stream
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Live Feed
            </span>
          </div>

          {/* Bar Visualization */}
          <div className="mt-6 space-y-4">
            {total > 0 ? (
              <>
                <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden p-0.5">
                  <div
                    style={{ width: `${successPct}%` }}
                    className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                    title={`Successful: ${successPct}%`}
                  />
                  <div
                    style={{ width: `${recoveredPct}%` }}
                    className="h-full bg-violet-500 transition-all duration-500"
                    title={`Recovered: ${recoveredPct}%`}
                  />
                  <div
                    style={{ width: `${failedPct}%` }}
                    className="h-full bg-rose-400 rounded-r-full transition-all duration-500"
                    title={`Unresolved: ${failedPct}%`}
                  />
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        First-Attempt Successful
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {successfulCount}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-mono-ui">
                        ({successPct}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-500/10">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_#a78bfa]" />
                      <span className="text-xs font-semibold text-violet-900 dark:text-violet-300">
                        RecoverIQ Intercepted & Recovered
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
                        {recoveredCount}
                      </span>
                      <span className="text-[10px] text-violet-500 ml-1.5 font-mono-ui">
                        ({recoveredPct}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Terminal / Unresolved
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {unrecoveredCount}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-mono-ui">
                        ({failedPct}%)
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No event data available.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>Total Stream Events: {total}</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Gateway Sync Active
          </span>
        </div>
      </div>

      {/* CENTER: Recovery Rate Circular Gauge (3 cols) */}
      <div className="lg:col-span-3 flex flex-col justify-between items-center text-center rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] p-5">
        <div className="w-full">
          <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white text-left">
            Recovery Rate
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 text-left mb-3">
            Target benchmark: &gt;80%
          </p>
        </div>

        {/* Circular Gauge */}
        <div className="relative flex items-center justify-center my-3">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-100 dark:text-slate-800"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-emerald-500 transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-heading text-3xl font-black text-slate-900 dark:text-white">
              {recoveryRate !== null ? `${recoveryRate}%` : "—"}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Recovered
            </span>
          </div>
        </div>

        <div className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
            AI + Policy + Smart Recovery
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500">
            Autonomous sequence execution
          </div>
        </div>
      </div>

      {/* RIGHT: Live Activity Feed (4 cols) */}
      <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] p-5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white">
                Live Activity
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Recent payment events & actions
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
              <span className="h-2 w-2 rounded-full bg-violet-500 animate-ping" />
              <span>Real-time</span>
            </div>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {recentEvents.length > 0 ? (
              recentEvents.map((evt, i) => {
                const isFailed = Boolean(evt.failure_code);
                const isSelected = selectedEvent?.event_id === evt.event_id;

                return (
                  <div
                    key={evt.event_id || i}
                    onClick={() => onSelectEvent(evt)}
                    className={`group flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-violet-500/50 bg-violet-50/50 dark:bg-violet-950/30"
                        : "border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          isFailed
                            ? "bg-rose-500/10 text-rose-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {isFailed ? <ShieldAlert size={14} /> : <CheckCircle2 size={14} />}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {isFailed ? evt.failure_code : "Payment Recovered"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            • {evt.bank || "UPI"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {evt.event_id?.slice(0, 8)}... • {timeAgo(evt.occurred_at)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div className="text-xs font-bold font-mono-ui text-slate-900 dark:text-white">
                        {fmtINR(evt.amount_paise, true)}
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          isFailed ? "text-amber-500" : "text-emerald-500"
                        }`}
                      >
                        {isFailed ? "Diagnosing" : "Settled"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No events in feed.
              </div>
            )}
          </div>
        </div>

        {selectedEvent && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60">
            <button
              onClick={() => onRunPipeline(selectedEvent)}
              disabled={running}
              className="flex w-full items-center justify-between rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3.5 py-2 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-all shadow-sm"
            >
              <span>{running ? "Analyzing Pipeline..." : "Diagnose Selected Event"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
