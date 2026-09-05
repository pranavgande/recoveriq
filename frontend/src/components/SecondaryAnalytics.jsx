import React from "react";
import { AlertCircle, Landmark, Store } from "lucide-react";

export default function SecondaryAnalytics({ events }) {
  // 1. Calculate top failure reasons
  const failureCounts = {};
  // 2. Calculate top issuing banks
  const bankCounts = {};
  // 3. Calculate top merchants
  const merchantCounts = {};

  (events || []).forEach((e) => {
    if (e.failure_code) {
      failureCounts[e.failure_code] = (failureCounts[e.failure_code] || 0) + 1;
    }
    if (e.bank) {
      bankCounts[e.bank] = (bankCounts[e.bank] || 0) + 1;
    }
    const merchant = e._raw?.merchant_id || "M_DEFAULT";
    merchantCounts[merchant] = (merchantCounts[merchant] || 0) + 1;
  });

  const getTopItems = (countsObj) => {
    const sorted = Object.entries(countsObj).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return [];
    const maxVal = sorted[0][1] || 1;
    return sorted.slice(0, 4).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / maxVal) * 100),
    }));
  };

  const topFailures = getTopItems(failureCounts);
  const topBanks = getTopItems(bankCounts);
  const topMerchants = getTopItems(merchantCounts);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. Top Failure Reasons */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
            <AlertCircle size={14} />
          </div>
          <h4 className="font-heading text-xs font-bold text-slate-900 dark:text-white">
            Top Failure Reasons
          </h4>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">
          Root cause distribution in current feed
        </p>

        {topFailures.length > 0 ? (
          <div className="space-y-3">
            {topFailures.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300 font-mono-ui text-[11px]">
                    {item.name}
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {item.count}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${item.pct}%` }}
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            No data
          </div>
        )}
      </div>

      {/* 2. Top Issuing Banks */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <Landmark size={14} />
          </div>
          <h4 className="font-heading text-xs font-bold text-slate-900 dark:text-white">
            Top Issuing Banks
          </h4>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">
          Volume & degradation tracking by bank
        </p>

        {topBanks.length > 0 ? (
          <div className="space-y-3">
            {topBanks.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {item.name}
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {item.count}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${item.pct}%` }}
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            No data
          </div>
        )}
      </div>

      {/* 3. Top Merchants */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] p-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Store size={14} />
          </div>
          <h4 className="font-heading text-xs font-bold text-slate-900 dark:text-white">
            Top Merchants
          </h4>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">
          Merchant checkout activity & volume
        </p>

        {topMerchants.length > 0 ? (
          <div className="space-y-3">
            {topMerchants.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300 font-mono-ui text-[11px]">
                    {item.name}
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {item.count}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${item.pct}%` }}
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            No data
          </div>
        )}
      </div>
    </div>
  );
}
