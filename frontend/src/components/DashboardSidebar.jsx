import React from "react";
import {
  LayoutDashboard,
  Zap,
  GitBranch,
  Shield,
  Cpu,
  BarChart3,
  FileText,
  Settings,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "events", label: "Payment Events", icon: Zap },
  { id: "pipeline", label: "Recovery Pipeline", icon: GitBranch },
  { id: "policy", label: "Policy Engine", icon: Shield },
  { id: "executors", label: "Executors", icon: Cpu },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "audit", label: "Audit Logs", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function DashboardSidebar({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  onExploreClick,
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#182033] bg-[#07090e] text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#182033] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-emerald-400 text-white shadow-md shadow-indigo-500/20">
              <ShieldCheck size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <span className="font-heading text-lg font-black tracking-tight text-white">
                Recover<span className="text-emerald-400">IQ</span>
              </span>
              <span className="block text-[10px] font-medium tracking-widest text-slate-400 uppercase">
                Revenue Resilience
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Platform
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-slate-800/90 text-white shadow-sm border border-slate-700/60 font-bold"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                  }`}
                >
                  <Icon
                    size={16}
                    className={`transition-colors ${
                      isActive
                        ? "text-emerald-400"
                        : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Card */}
        <div className="p-4 border-t border-[#182033]">
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-950/30 to-slate-900/50 p-4 text-slate-300">
            <div className="flex items-center gap-2 text-violet-400 mb-1.5">
              <Sparkles size={14} />
              <span className="text-[11px] font-bold tracking-wide uppercase">
                AI-Powered Recovery
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400 mb-3">
              Turn failed payments into recovered revenue with intelligent, bounded automation.
            </p>
            <button
              onClick={() => {
                setActiveTab("pipeline");
                if (onExploreClick) onExploreClick();
              }}
              className="group flex w-full items-center justify-between rounded-xl bg-violet-600/90 hover:bg-violet-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/30 transition-colors"
            >
              <span>Explore Recovery</span>
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
