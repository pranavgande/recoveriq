import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, StepForward, Radio } from "lucide-react";
import { fmtINR, timeAgo, shortId } from "../lib/api";

const failureColor = {
  BANK_DEGRADATION: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30",
  MERCHANT_CHECKOUT_REGRESSION:
    "text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/30",
  NETWORK_LATENCY: "text-[#3395FF] bg-[#3395FF]/10 border-[#3395FF]/30",
  CARD_DECLINED: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30",
  FRAUD_HOLD: "text-[#0D2366] bg-[#0D2366]/10 border-[#0D2366]/30",
};

export default function EventStream({
  events,
  selectedId,
  onSelect,
  autoStream,
  setAutoStream,
  onManualNext,
}) {
  return (
    <section
      className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden flex flex-col h-full"
      data-testid="event-stream"
    >
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-white/70 backdrop-blur-xl sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="pulse-dot inline-block w-2 h-2 rounded-full bg-[#3395FF] text-[#3395FF]" />
            <span className="text-[10px] font-bold tracking-[0.22em] text-[#3395FF] uppercase">
              Live
            </span>
          </div>
          <h3 className="text-lg font-heading font-bold text-[#0D2366]">
            Failed Payment Events
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoStream(!autoStream)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              autoStream
                ? "bg-[#3395FF] text-white border-[#3395FF]"
                : "bg-white text-[#0D2366] border-[#E2E8F0] hover:border-[#3395FF]"
            }`}
            data-testid="toggle-auto-stream"
          >
            {autoStream ? <Pause size={12} /> : <Play size={12} />}
            {autoStream ? "Pause" : "Auto"}
          </button>
          <button
            onClick={onManualNext}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border bg-white text-[#0D2366] border-[#E2E8F0] hover:border-[#3395FF] transition-colors"
            data-testid="manual-next"
          >
            <StepForward size={12} /> Next
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scroll-thin p-3 space-y-2 max-h-[600px]">
        <AnimatePresence initial={false}>
          {events.length === 0 && (
            <div className="text-sm text-[#94A3B8] p-6">
              Waiting for events…
            </div>
          )}
          {events.map((e) => {
            const isSel = e.event_id === selectedId;
            return (
              <motion.button
                layout
                key={e.event_id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                whileHover={{ x: 2 }}
                onClick={() => onSelect(e)}
                className={`w-full text-left bg-white border rounded-xl p-4 border-l-4 transition-colors ${
                  isSel
                    ? "border-[#3395FF] border-l-[#3395FF] shadow-[0_6px_20px_-8px_rgba(51,149,255,0.35)]"
                    : "border-[#E2E8F0] border-l-transparent hover:border-[#3395FF] hover:border-l-[#3395FF]"
                }`}
                data-testid={`event-${e.event_id}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Radio size={14} className="text-[#3395FF] flex-shrink-0" />
                    <span className="font-mono-ui text-sm text-[#0D2366] truncate">
                      {e.event_id}
                    </span>
                  </div>
                  <span className="font-heading font-bold text-[#0D2366]">
                    {fmtINR(e.amount_paise)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={`inline-block text-[10px] font-bold tracking-[0.14em] uppercase px-2 py-0.5 rounded-full border ${
                      failureColor[e.failure_code] ||
                      "text-[#0D2366] bg-[#F1F5F9] border-[#E2E8F0]"
                    }`}
                  >
                    {(e.failure_code || "UNKNOWN").replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-[#94A3B8]">
                    {e.method?.toUpperCase()} · {e.bank} ·{" "}
                    {timeAgo(e.occurred_at)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#4B5563] line-clamp-1">
                  {e.failure_note}
                </p>
                <p className="mt-1 text-[10px] text-[#94A3B8] font-mono-ui">
                  order {shortId(e.order_id, 14)}
                </p>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
