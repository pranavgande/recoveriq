import React from "react";
import { motion } from "framer-motion";
import { fmtINR } from "../lib/api";

const Stat = ({ label, value, sub, idx }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.05, duration: 0.4 }}
    className="flex flex-col gap-1 border-l border-[#E2E8F0] pl-6 first:border-0 first:pl-0"
    data-testid={`kpi-${(label || "unknown").toLowerCase().replace(/\s+/g, "-")}`}
  >
    <span className="text-[10px] font-bold tracking-[0.22em] text-[#94A3B8] uppercase">
      {label}
    </span>
    <span className="text-2xl lg:text-3xl font-black font-heading text-[#0D2366]">
      {value}
    </span>
    {sub && <span className="text-xs text-[#94A3B8]">{sub}</span>}
  </motion.div>
);

export default function KpiBar({ metrics }) {
  const m = metrics || {};
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-6 gap-6 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_2px_20px_-8px_rgba(13,35,102,0.15)]"
      data-testid="kpi-bar"
    >
      <Stat
        idx={0}
        label="Recovered Revenue"
        value={fmtINR(m.recovered_revenue_paise)}
      />
      <Stat
        idx={1}
        label="Success Rate"
        value={`${m.success_rate ?? 0}%`}
        sub="via recovery pipeline"
      />
      <Stat
        idx={2}
        label="Events Processed"
        value={m.total_events_processed ?? 0}
      />
      <Stat
        idx={3}
        label="Escalated"
        value={m.escalated ?? 0}
        sub="safely stopped"
      />
      <Stat
        idx={4}
        label="Duplicates Blocked"
        value={m.duplicate_blocked ?? 0}
        sub="at-most-once"
      />
      <Stat idx={5} label="Avg Latency" value={`${m.avg_latency_ms ?? 0} ms`} />
    </div>
  );
}
