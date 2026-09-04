import React from "react";
import { Database, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { shortId, timeAgo, fmtINR } from "../lib/api";

const statusStyle = {
  PENDING: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30",
  SUCCESS: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30",
  ESCALATED: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30",
  DUPLICATE_BLOCKED: "text-[#3395FF] bg-[#3395FF]/10 border-[#3395FF]/30",
  SDK_ERROR: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30",
};

const Table = ({ title, sub, rows, columns, testId }) => (
  <div
    className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden"
    data-testid={testId}
  >
    <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <Database size={14} className="text-[#3395FF]" />
          <span className="text-[10px] font-bold tracking-[0.22em] text-[#3395FF] uppercase">
            SQLite · {title}
          </span>
        </div>
        <div className="text-sm text-[#4B5563] mt-0.5">{sub}</div>
      </div>
      <span className="text-xs font-mono-ui text-[#94A3B8]">
        {rows.length} rows
      </span>
    </div>
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full text-left">
        <thead className="bg-white">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="px-4 py-3 text-[10px] font-bold tracking-[0.18em] text-[#0D2366] uppercase border-b border-[#E2E8F0]"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-[#94A3B8]"
              >
                No records yet — trigger the pipeline or a failure scenario.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <motion.tr
                key={r.reservation_id || r.execution_id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]/60"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="px-4 py-3 font-mono-ui text-xs text-[#4B5563]"
                  >
                    {c.render ? c.render(r) : (r[c.key] ?? "—")}
                  </td>
                ))}
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default function AuditTables({ reservations, executors, onRefresh }) {
  return (
    <section className="space-y-6" data-testid="audit-section">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold tracking-[0.22em] text-[#3395FF] uppercase">
            Immutable Audit State
          </div>
          <h3 className="text-2xl font-heading font-bold text-[#0D2366]">
            Reading from idempotency.db (WAL enabled)
          </h3>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border border-[#E2E8F0] bg-white text-[#0D2366] hover:border-[#3395FF] transition-colors"
          data-testid="refresh-audit"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <Table
        testId="table-reservations"
        title="action_reservations"
        sub="Pre-claimed PENDING locks — atomic UPSERTs guarantee single-writer."
        rows={reservations}
        columns={[
          {
            key: "reservation_id",
            label: "Reservation",
            render: (r) => shortId(r.reservation_id, 26),
          },
          {
            key: "event_id",
            label: "Event",
            render: (r) => shortId(r.event_id, 14),
          },
          { key: "action", label: "Action" },
          {
            key: "status",
            label: "Status",
            render: (r) => (
              <span
                className={`text-[10px] font-bold tracking-[0.14em] uppercase px-2 py-0.5 rounded-full border ${statusStyle[r.status] || "text-[#4B5563] bg-[#F1F5F9] border-[#E2E8F0]"}`}
              >
                {r.status}
              </span>
            ),
          },
          { key: "worker_id", label: "Worker" },
          {
            key: "claimed_at",
            label: "Claimed",
            render: (r) => timeAgo(r.claimed_at),
          },
        ]}
      />

      <Table
        testId="table-executors"
        title="executor_states"
        sub="Write-once execution log. Duplicate execution_ids fail on PK."
        rows={executors}
        columns={[
          {
            key: "execution_id",
            label: "Execution",
            render: (r) => shortId(r.execution_id, 22),
          },
          {
            key: "reservation_id",
            label: "Reservation",
            render: (r) => shortId(r.reservation_id, 22),
          },
          {
            key: "razorpay_ref",
            label: "Razorpay Ref",
            render: (r) => shortId(r.razorpay_ref, 22),
          },
          {
            key: "outcome",
            label: "Outcome",
            render: (r) => (
              <span
                className={`text-[10px] font-bold tracking-[0.14em] uppercase px-2 py-0.5 rounded-full border ${statusStyle[r.outcome] || "text-[#4B5563] bg-[#F1F5F9] border-[#E2E8F0]"}`}
              >
                {r.outcome}
              </span>
            ),
          },
          {
            key: "amount_paise",
            label: "Amount",
            render: (r) => fmtINR(r.amount_paise),
          },
          {
            key: "latency_ms",
            label: "Latency",
            render: (r) => `${r.latency_ms} ms`,
          },
          {
            key: "created_at",
            label: "When",
            render: (r) => timeAgo(r.created_at),
          },
        ]}
      />
    </section>
  );
}
