import React from "react";
import { Search, Bell, Sun, Moon, Menu, ChevronDown, CheckCircle2 } from "lucide-react";

export default function TopBar({
  darkMode,
  setDarkMode,
  searchQuery,
  setSearchQuery,
  onOpenMobileSidebar,
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#07090e]/80 px-4 sm:px-6 backdrop-blur-md transition-colors">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, merchants, banks..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 py-2 pl-9 pr-4 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-violet-500 focus:bg-white dark:focus:bg-[#0f1422] focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* System Health Status Indicator */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Policy Engine Active</span>
        </div>

        {/* Date Selector */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span>Today</span>
          <ChevronDown size={14} className="text-slate-400" />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle Dark Mode"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
        </button>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Bell size={16} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-violet-500" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-xs font-bold text-white shadow-sm">
            OP
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Dev Console
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500">
              operator@recoveriq.ai
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
