import React, { useState } from "react";
import { GitBranch, Shield, Cpu, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { fmtINR, fmtINRRaw, timeAgo } from "@/lib/api";

export default function OperationalViews({
  activeTab,
  workflows,
  reservations,
  executors,
  onRefresh,
}) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
            {activeTab === "pipeline" && "Autonomous Recovery Workflows"}
            {activeTab === "policy" && "Policy Engine & Idempotency Reservations"}
            {activeTab === "executors" && "Executor States & Gateway Traces"}
            {activeTab === "audit" && "State Store & Audit Registry"}
          </h2>
          <p className="text-xs text-slate-400">
            Real-time deterministic system state directly from SQLite repository
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span>Refresh Store</span>
        </button>
      </div>

      {/* 1. Recovery Workflows Table */}
      {(activeTab === "pipeline" || activeTab === "audit") && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-5 py-4">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
              <GitBranch size={16} className="text-violet-500" />
              <span>Multi-Step Recovery Workflows ({workflows?.length || 0})</span>
            </div>
            <span className="text-[11px] font-mono-ui text-slate-400">
              Table: recovery_workflows
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-medium">Workflow ID</th>
                  <th className="px-5 py-3 font-medium">Attempt Group</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Current Step</th>
                  <th className="px-5 py-3 font-medium">Next Action</th>
                  <th className="px-5 py-3 font-medium">At Risk</th>
                  <th className="px-5 py-3 font-medium">Recovered</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono-ui text-[11px]">
                {workflows?.length ? (
                  workflows.map((wf) => (
                    <tr
                      key={wf.workflow_id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-bold text-violet-600 dark:text-violet-400">
                        {wf.workflow_id}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                        {wf.payment_attempt_group_id?.slice(0, 16)}...
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            wf.status === "RECOVERED"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : wf.status === "ACTIVE"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {wf.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300 font-bold">
                        Step {wf.current_step}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {wf.next_action || "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-900 dark:text-white font-bold">
                        {fmtINRRaw(wf.total_at_risk)}
                      </td>
                      <td className="px-5 py-3 text-emerald-500 font-bold">
                        {fmtINRRaw(wf.total_recovered_amount)}
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {timeAgo(wf.updated_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                      No recovery workflows registered yet. Run an event pipeline to initialize.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Policy Engine Reservations */}
      {(activeTab === "policy" || activeTab === "audit") && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-5 py-4">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
              <Shield size={16} className="text-emerald-500" />
              <span>Idempotency Action Reservations ({reservations?.length || 0})</span>
            </div>
            <span className="text-[11px] font-mono-ui text-slate-400">
              Table: action_reservations
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-medium">Idempotency Key</th>
                  <th className="px-5 py-3 font-medium">Decision</th>
                  <th className="px-5 py-3 font-medium">Worker ID</th>
                  <th className="px-5 py-3 font-medium">Claimed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono-ui text-[11px]">
                {reservations?.length ? (
                  reservations.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">
                        {row.reservation_id}
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                          {row.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{row.worker_id}</td>
                      <td className="px-5 py-3 text-slate-400">
                        {timeAgo(row.claimed_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                      No active idempotency locks.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Executor States */}
      {(activeTab === "executors" || activeTab === "audit") && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422]">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-5 py-4">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
              <Cpu size={16} className="text-blue-500" />
              <span>Executor States & Gateway References ({executors?.length || 0})</span>
            </div>
            <span className="text-[11px] font-mono-ui text-slate-400">
              Table: executor_states
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-medium">Execution ID</th>
                  <th className="px-5 py-3 font-medium">Outcome</th>
                  <th className="px-5 py-3 font-medium">Gateway Ref</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Latency</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono-ui text-[11px]">
                {executors?.length ? (
                  executors.map((row, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-200">
                        {row.execution_id?.slice(0, 16)}...
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-500">
                          {row.outcome}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {row.razorpay_ref || "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-900 dark:text-white font-bold">
                        {fmtINR(row.amount_paise, true)}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                        {row.latency_ms}ms
                      </td>
                      <td className="px-5 py-3 text-slate-400">
                        {timeAgo(row.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No executions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
