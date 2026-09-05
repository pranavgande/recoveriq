import React from "react";
import { CreditCard, AlertTriangle, CheckCircle2, TrendingUp, ArrowUpRight } from "lucide-react";
import { fmtINRRaw } from "@/lib/api";

export default function KpiGrid({ metrics, events }) {
  // 1. Total Transactions: derived from metrics.total_events_processed, or actual events length if present
  let totalTransactionsStr = "—";
  if (metrics?.total_events_processed !== undefined && metrics?.total_events_processed !== null) {
    totalTransactionsStr = Number(metrics.total_events_processed).toLocaleString();
  } else if (events && events.length > 0) {
    totalTransactionsStr = events.length.toLocaleString();
  }

  // 2. Failed Payments: derived from metrics.workflow_total_count or actual failed events
  let failedPaymentsStr = "—";
  if (metrics?.workflow_total_count !== undefined && metrics?.workflow_total_count !== null) {
    failedPaymentsStr = Number(metrics.workflow_total_count).toLocaleString();
  } else if (events && events.length > 0) {
    const count = events.filter((e) => Boolean(e.failure_code)).length;
    failedPaymentsStr = count.toLocaleString();
  }

  // 3. Recovered: derived strictly from backend metrics.workflow_recovered_count
  let recoveredStr = "—";
  if (metrics?.workflow_recovered_count !== undefined && metrics?.workflow_recovered_count !== null) {
    recoveredStr = Number(metrics.workflow_recovered_count).toLocaleString();
  }

  // 4. Revenue Recovered: derived strictly from backend workflow_total_recovered (or recovered_revenue_paise / 100)
  let revenueRecoveredStr = "—";
  if (metrics?.workflow_total_recovered !== undefined && metrics?.workflow_total_recovered !== null && metrics.workflow_total_recovered > 0) {
    revenueRecoveredStr = fmtINRRaw(metrics.workflow_total_recovered);
  } else if (metrics?.recovered_revenue_paise !== undefined && metrics?.recovered_revenue_paise !== null && metrics.recovered_revenue_paise > 0) {
    revenueRecoveredStr = fmtINRRaw(metrics.recovered_revenue_paise / 100);
  }

  // 5. Recovery Rate: derived strictly from backend metrics
  let recoveryRateLabel = "Rate";
  if (metrics?.workflow_recovery_rate !== undefined && metrics?.workflow_recovery_rate !== null) {
    recoveryRateLabel = `${metrics.workflow_recovery_rate}% rate`;
  } else if (metrics?.success_rate !== undefined && metrics?.success_rate !== null) {
    recoveryRateLabel = `${metrics.success_rate}% rate`;
  }

  const cards = [
    {
      title: "Total Transactions",
      value: totalTransactionsStr,
      change: totalTransactionsStr !== "—" ? "Live sync" : "No data",
      trend: "up",
      label: "Gateway stream processed",
      icon: CreditCard,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Failed Payments",
      value: failedPaymentsStr,
      change: failedPaymentsStr !== "—" ? "Intercepted" : "No data",
      trend: "down",
      label: "Intercepted by gateway",
      icon: AlertTriangle,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Recovered",
      value: recoveredStr,
      change: recoveredStr !== "—" ? recoveryRateLabel : "No data",
      trend: "up",
      label: "Autonomous resolution",
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Revenue Recovered",
      value: revenueRecoveredStr,
      change: revenueRecoveredStr !== "—" ? "Direct state" : "No data",
      trend: "up",
      label: "Preserved transaction value",
      icon: TrendingUp,
      color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg ${
              card.highlight
                ? "border-violet-500/30 bg-gradient-to-br from-violet-500/5 via-white to-white dark:from-violet-950/20 dark:via-[#0f1422] dark:to-[#0f1422] dark:border-violet-500/30"
                : "border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422]"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${card.color}`}>
                <Icon size={16} />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <div className="font-heading text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {card.value}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-400 dark:text-slate-500">
                {card.label}
              </span>
              <span
                className={`inline-flex items-center font-bold ${
                  card.value === "—"
                    ? "text-slate-400"
                    : card.trend === "up"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {card.change}
                {card.value !== "—" && <ArrowUpRight size={12} className="ml-0.5" />}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
