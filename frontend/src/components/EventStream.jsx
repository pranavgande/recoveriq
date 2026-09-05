import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Radio, StepForward } from "lucide-react";
import { fmtINR, shortId, timeAgo } from "../lib/api";

const failureStyles = {
  BANK_DEGRADATION: "bg-amber-50 text-amber-700 border-amber-200",
  MERCHANT_CHECKOUT_REGRESSION: "bg-violet-50 text-violet-700 border-violet-200",
  NETWORK_LATENCY: "bg-blue-50 text-blue-700 border-blue-200",
  CARD_DECLINED: "bg-red-50 text-red-700 border-red-200",
  FRAUD_HOLD: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function EventStream({
  events = [],
  selectedId,
  onSelect,
  autoStream,
  setAutoStream,
  onManualNext,
}) {
  return (
    <aside
      className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white"
      data-testid="event-stream"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live queue
          </div>
          <h3 className="mt-1 font-heading text-lg font-black text-[#0D2366]">
            Failed payments
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoStream(!autoStream)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-bold text-[#0D2366] transition hover:border-blue-200 hover:bg-blue-50"
            data-testid="toggle-auto-stream"
          >
            {autoStream ? <Pause size={11} /> : <Play size={11} />}
            {autoStream ? "Pause" : "Auto"}
          </button>
          <button
            onClick={onManualNext}
            className="inline-flex items-center gap-1 rounded-lg bg-[#0D2366] px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-[#16398e]"
            data-testid="manual-next"
          >
            <StepForward size={11} />
            Next
          </button>
        </div>
      </div>

      <div className="max-h-[760px] space-y-2 overflow-y-auto p-3 scroll-thin">
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center">
              <Radio size={20} className="mx-auto text-slate-300" />
              <div className="mt-3 text-xs font-semibold text-slate-500">
                No failed payments yet
              </div>
              <div className="mt-1 text-[10px] leading-relaxed text-slate-400">
                Press Next to generate a synthetic event.
              </div>
            </div>
          ) : (
            events.map((e) => {
              const selected = e.event_id === selectedId;
              return (
                <motion.button
                  layout
                  key={e.event_id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -1 }}
                  onClick={() => onSelect(e)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-blue-300 bg-blue-50/60 shadow-[0_8px_24px_-18px_rgba(37,99,235,.5)]"
                      : "border-slate-200 bg-white hover:border-blue-200"
                  }`}
                  data-testid={`event-${e.event_id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          <Radio size={12} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-mono text-[10px] font-bold text-[#0D2366]">
                            {shortId(e.event_id, 15)}
                          </div>
                          <div className="mt-0.5 truncate text-[9px] text-slate-400">
                            {e.method?.toUpperCase()} · {e.bank || "Unknown"} · {timeAgo(e.occurred_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 font-heading text-sm font-black text-[#0D2366]">
                      {fmtINR(e.amount_paise)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${
                      failureStyles[e.failure_code] || "border-slate-200 bg-slate-100 text-slate-600"
                    }`}>
                      {(e.failure_code || "UNKNOWN").replace(/_/g, " ")}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {selected ? "Selected" : "Inspect"}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-slate-500">
                    {e.failure_note || "No failure note available."}
                  </p>
                </motion.button>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
