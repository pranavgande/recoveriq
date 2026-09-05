import React, { useState } from "react";
import { Zap, ShieldAlert, CheckCircle2, ArrowRight, RefreshCw, Filter, Search } from "lucide-react";
import { fmtINR, timeAgo } from "@/lib/api";

export default function EventsList({
  events,
  selectedEvent,
  onSelectEvent,
  onRunPipeline,
  running,
  onRefresh,
}) {
  const [filter, setFilter] = useState("all"); // "all", "failed", "success"
  const [search, setSearch] = useState("");

  const filteredEvents = (events || []).filter((e) => {
    const isFailed = Boolean(e.failure_code);
    if (filter === "failed" && !isFailed) return false;
    if (filter === "success" && isFailed) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchId = (e.event_id || "").toLowerCase().includes(q);
      const matchBank = (e.bank || "").toLowerCase().includes(q);
      const matchCode = (e.failure_code || "").toLowerCase().includes(q);
      const matchMerchant = (e._raw?.merchant_id || "").toLowerCase().includes(q);
      return matchId || matchBank || matchCode || matchMerchant;
    }
    return true;
  });

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 p-5">
        <div>
          <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
            Payment Events Stream
          </h3>
          <p className="text-xs text-slate-400">
            Real-time webhook ingestion directly from gateway simulator
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by bank, code..."
              className="h-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 pl-8 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                filter === "all" ? "bg-white dark:bg-[#0f1422] text-slate-900 dark:text-white shadow-sm" : ""
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("failed")}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                filter === "failed" ? "bg-white dark:bg-[#0f1422] text-rose-500 shadow-sm" : ""
              }`}
            >
              Failed
            </button>
            <button
              onClick={() => setFilter("success")}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                filter === "success" ? "bg-white dark:bg-[#0f1422] text-emerald-500 shadow-sm" : ""
              }`}
            >
              Settled
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3 font-medium">Event ID</th>
              <th className="px-5 py-3 font-medium">Merchant</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Bank / Method</th>
              <th className="px-5 py-3 font-medium">Status / Reason</th>
              <th className="px-5 py-3 font-medium">Occurred</th>
              <th className="px-5 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono-ui text-[11px]">
            {filteredEvents.map((evt) => {
              const isFailed = Boolean(evt.failure_code);
              const isSelected = selectedEvent?.event_id === evt.event_id;

              return (
                <tr
                  key={evt.event_id}
                  onClick={() => onSelectEvent(evt)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-violet-50/60 dark:bg-violet-950/20"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                  }`}
                >
                  <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">
                    {evt.event_id?.slice(0, 14)}...
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-400 font-sans">
                    {evt._raw?.merchant_id || "M_DEFAULT"}
                  </td>
                  <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">
                    {fmtINR(evt.amount_paise, true)}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300 font-sans">
                    {evt.bank || "UPI"} • {evt.method || "CARD"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        isFailed
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-emerald-500/10 text-emerald-500"
                      }`}
                    >
                      {isFailed ? evt.failure_code : "SUCCESS"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 font-sans">
                    {timeAgo(evt.occurred_at)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                        onRunPipeline(evt);
                      }}
                      disabled={running}
                      className="rounded-lg bg-violet-600/10 hover:bg-violet-600 text-violet-600 hover:text-white px-2.5 py-1 text-[10px] font-bold font-sans transition-colors"
                    >
                      Diagnose
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
