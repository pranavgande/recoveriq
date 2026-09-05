import React from "react";
import { motion } from "framer-motion";
import { Activity, AlertCircle, IndianRupee, ShieldCheck } from "lucide-react";
import { fmtINR } from "../lib/api";

function Stat({ icon: Icon, label, value, sub, idx, tone = "blue" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.3 }}
      className="border-r border-slate-200 last:border-r-0"
    >
      <div className="px-5 py-4 lg:px-6">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${tones[tone]}`}>
            <Icon size={14} />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </span>
        </div>
        <div className="mt-3 text-2xl font-heading font-black tracking-tight text-[#0D2366]">
          {value}
        </div>
        {sub && <div className="mt-1 text-[10px] text-slate-400">{sub}</div>}
      </div>
    </motion.div>
  );
}

export default function KpiBar({ metrics }) {
  const m = metrics || {};
  return (
    <div
      className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_-22px_rgba(13,35,102,.32)] lg:grid-cols-4"
      data-testid="kpi-bar"
    >
      <Stat
        idx={0}
        icon={IndianRupee}
        label="Recovered"
        value={fmtINR(m.recovered_revenue_paise)}
        sub="synthetic evaluation"
        tone="green"
      />
      <Stat
        idx={1}
        icon={Activity}
        label="Recovery rate"
        value={`${m.success_rate ?? 0}%`}
        sub={`${m.total_events_processed ?? 0} events processed`}
        tone="blue"
      />
      <Stat
        idx={2}
        icon={AlertCircle}
        label="Needs review"
        value={m.escalated ?? 0}
        sub="human escalation"
        tone="amber"
      />
      <Stat
        idx={3}
        icon={ShieldCheck}
        label="Duplicates blocked"
        value={m.duplicate_blocked ?? 0}
        sub="at-most-once"
        tone="red"
      />
    </div>
  );
}
