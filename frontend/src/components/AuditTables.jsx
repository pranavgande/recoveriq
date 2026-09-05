import React from "react";
import { Database, RefreshCw } from "lucide-react";
import { shortId, timeAgo, fmtINR } from "../lib/api";

const statusStyle = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ESCALATED: "bg-amber-50 text-amber-700 border-amber-200",
  DUPLICATE_BLOCKED: "bg-blue-50 text-blue-700 border-blue-200",
  SDK_ERROR: "bg-red-50 text-red-700 border-red-200",
};

function Pill({ value }) {
  return (
    <span className={`rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.11em] ${
      statusStyle[value] || "border-slate-200 bg-slate-100 text-slate-600"
    }`}>
      {value || "—"}
    </span>
  );
}

function Table({ title, sub, rows = [], columns, testId }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" data-testid={testId}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
            <Database size={12} className="text-[#3395FF]" />
            {title}
          </div>
          <div className="mt-1 text-[11px] leading-relaxed text-slate-400">{sub}</div>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 font-mono text-[9px] text-slate-500">
          {rows.length} rows
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-9 text-center text-[11px] text-slate-400">
                  No records yet.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.reservation_id || row.execution_id || index}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 font-mono text-[10px] text-slate-500">
                      {column.render ? column.render(row) : row[column.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AuditTables({ reservations = [], executors = [], onRefresh }) {
  return (
    <section className="space-y-4" data-testid="audit-section">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[11px] text-slate-400">
          Persistent execution state and recovery reservations.
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-[#0D2366] transition hover:border-blue-200"
          data-testid="refresh-audit"
        >
          <RefreshCw size={11} />
          Refresh
        </button>
      </div>

      <Table
        testId="table-reservations"
        title="Action reservations"
        sub="Pre-claimed locks used to enforce single-writer behavior."
        rows={reservations}
        columns={[
          {
            key: "reservation_id",
            label: "Reservation",
            render: (row) => shortId(row.reservation_id, 24),
          },
          {
            key: "event_id",
            label: "Event",
            render: (row) => shortId(row.event_id, 14),
          },
          { key: "action", label: "Action" },
          {
            key: "status",
            label: "Status",
            render: (row) => <Pill value={row.status} />,
          },
          { key: "worker_id", label: "Worker" },
          {
            key: "claimed_at",
            label: "Claimed",
            render: (row) => timeAgo(row.claimed_at),
          },
        ]}
      />

      <Table
        testId="table-executors"
        title="Executor states"
        sub="Write-once execution records and outcomes."
        rows={executors}
        columns={[
          {
            key: "execution_id",
            label: "Execution",
            render: (row) => shortId(row.execution_id, 22),
          },
          {
            key: "reservation_id",
            label: "Reservation",
            render: (row) => shortId(row.reservation_id, 20),
          },
          {
            key: "razorpay_ref",
            label: "Reference",
            render: (row) => shortId(row.razorpay_ref, 20),
          },
          {
            key: "outcome",
            label: "Outcome",
            render: (row) => <Pill value={row.outcome} />,
          },
          {
            key: "amount_paise",
            label: "Amount",
            render: (row) => fmtINR(row.amount_paise),
          },
          {
            key: "latency_ms",
            label: "Latency",
            render: (row) => `${row.latency_ms} ms`,
          },
          {
            key: "created_at",
            label: "When",
            render: (row) => timeAgo(row.created_at),
          },
        ]}
      />
    </section>
  );
}
