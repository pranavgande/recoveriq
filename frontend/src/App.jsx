import React, { useCallback, useEffect, useRef, useState } from "react";
import "@/App.css";
import { Toaster, toast } from "sonner";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";

import DashboardSidebar from "@/components/DashboardSidebar";
import TopBar from "@/components/TopBar";
import KpiGrid from "@/components/KpiGrid";
import PrimaryAnalytics from "@/components/PrimaryAnalytics";
import SecondaryAnalytics from "@/components/SecondaryAnalytics";
import AiDiagnosisBanner from "@/components/AiDiagnosisBanner";
import RecoveryPipeline from "@/components/RecoveryPipeline";
import OperationalViews from "@/components/OperationalViews";
import EventsList from "@/components/EventsList";
import { api } from "@/lib/api";

export default function App() {
  // Theme state persisted in localStorage
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("recoveriq-theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("recoveriq-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("recoveriq-theme", "light");
    }
  }, [darkMode]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Backend state
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pipelineResult, setPipelineResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [executors, setExecutors] = useState([]);
  const [workflows, setWorkflows] = useState([]);

  // Fetch all backend telemetry
  const refreshState = useCallback(async () => {
    try {
      const [r, e, m, w] = await Promise.all([
        api.reservations().catch(() => []),
        api.executors().catch(() => []),
        api.metrics().catch(() => null),
        api.workflows().catch(() => []),
      ]);
      setReservations(r || []);
      setExecutors(e || []);
      setMetrics(m || null);
      setWorkflows(w || []);
    } catch {
      // Best-effort
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const list = await api.listEvents(60);
      const reversed = (list || []).reverse();
      setEvents(reversed);

      // Auto-select first failed event for demo experience
      if (reversed.length) {
        const firstFailed = reversed.find((e) => Boolean(e.failure_code)) || reversed[0];
        setSelected(firstFailed);
      }
    } catch {
      // Best-effort
    }
  }, []);

  useEffect(() => {
    loadEvents();
    refreshState();
  }, [loadEvents, refreshState]);

  // Poll metrics and state periodically
  useEffect(() => {
    const timer = setInterval(refreshState, 5000);
    return () => clearInterval(timer);
  }, [refreshState]);

  // Run pipeline for selected event
  const runFor = useCallback(
    async (event) => {
      if (!event) return;
      setSelected(event);
      setRunning(true);
      setPipelineResult(null);

      try {
        const res = await api.runPipeline(event);

        // Stage 1: AI Diagnosis + Customer Context + Revenue Risk
        setPipelineResult({
          diagnosis: res.diagnosis,
          risk: res.risk,
          customer_context: res.customer_context,
          recommended_strategy: res.recommended_strategy,
          strategy_reason: res.strategy_reason,
        });

        // Stage 2: Policy Gate decision
        await new Promise((resolve) => setTimeout(resolve, 400));
        setPipelineResult((prev) => ({
          ...prev,
          decision: res.decision,
        }));

        // Stage 3: Execution + Stage 4: Recovery Workflow
        await new Promise((resolve) => setTimeout(resolve, 400));
        setPipelineResult((prev) => ({
          ...prev,
          execution: res.execution,
          workflow: res.workflow,
          trace: res.trace,
        }));

        toast.success(`Autonomous diagnosis complete: ${res.diagnosis?.diagnosis_class}`);
      } catch (err) {
        toast.error("Pipeline run failed: " + (err.response?.data?.detail || err.message));
      } finally {
        setRunning(false);
        refreshState();
      }
    },
    [refreshState]
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
      <Toaster position="top-right" richColors />

      {/* 1. Left Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onExploreClick={() => {
          if (selected) runFor(selected);
        }}
      />

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* 2. Top Bar */}
        <TopBar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />

        {/* 3. Main Content Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1520px] w-full mx-auto space-y-7">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">
                <Sparkles size={13} />
                <span>RecoverIQ Engine</span>
              </div>
              <h1 className="font-heading text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {activeTab === "dashboard" && "Dashboard"}
                {activeTab === "events" && "Payment Events Feed"}
                {activeTab === "pipeline" && "Recovery Pipeline"}
                {activeTab === "policy" && "Policy Engine & Safeguards"}
                {activeTab === "executors" && "Gateway Executors"}
                {activeTab === "analytics" && "Revenue Analytics"}
                {activeTab === "audit" && "Audit Registry"}
                {activeTab === "settings" && "System Settings"}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time payment recovery intelligence •{" "}
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  Failed today. Recovered tomorrow.
                </span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const newEvt = await api.newEvent();
                    setEvents((prev) => [newEvt, ...prev].slice(0, 60));
                    setSelected(newEvt);
                    toast.info("Ingested new failed payment event");
                    await runFor(newEvt);
                  } catch {
                    toast.error("Failed to generate event");
                  }
                }}
                disabled={running}
                className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-violet-600/20 disabled:opacity-50 transition-all"
              >
                <Zap size={14} />
                <span>Simulate Failed Payment</span>
              </button>
            </div>
          </div>

          {/* TAB 1: MAIN DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-7">
              {/* KPI Row */}
              <KpiGrid metrics={metrics} events={events} />

              {/* Primary Analytics (3-column layout) */}
              <PrimaryAnalytics
                events={events}
                metrics={metrics}
                selectedEvent={selected}
                onSelectEvent={(evt) => setSelected(evt)}
                onRunPipeline={runFor}
                running={running}
              />

              {/* Secondary Analytics (Failure Reasons, Issuing Banks, Merchants) */}
              <SecondaryAnalytics events={events} />

              {/* AI Section Banner */}
              <AiDiagnosisBanner pipelineResult={pipelineResult} />

              {/* Dedicated Recovery Pipeline Detail */}
              <div className="pt-2">
                <div className="mb-4">
                  <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">
                    Selected Event Pipeline Execution
                  </h3>
                  <p className="text-xs text-slate-400">
                    Inspect the 4-stage diagnosis, policy constraints, execution, and multi-step recovery outcome
                  </p>
                </div>
                <RecoveryPipeline
                  selectedEvent={selected}
                  pipelineResult={pipelineResult}
                  running={running}
                  onRunPipeline={runFor}
                />
              </div>
            </div>
          )}

          {/* TAB 2: PAYMENT EVENTS */}
          {activeTab === "events" && (
            <EventsList
              events={events}
              selectedEvent={selected}
              onSelectEvent={(evt) => setSelected(evt)}
              onRunPipeline={runFor}
              running={running}
              onRefresh={loadEvents}
            />
          )}

          {/* TAB 3: RECOVERY PIPELINE */}
          {activeTab === "pipeline" && (
            <div className="space-y-7">
              <RecoveryPipeline
                selectedEvent={selected}
                pipelineResult={pipelineResult}
                running={running}
                onRunPipeline={runFor}
              />
              <OperationalViews
                activeTab="pipeline"
                workflows={workflows}
                reservations={reservations}
                executors={executors}
                onRefresh={refreshState}
              />
            </div>
          )}

          {/* TAB 4: POLICY ENGINE */}
          {activeTab === "policy" && (
            <OperationalViews
              activeTab="policy"
              workflows={workflows}
              reservations={reservations}
              executors={executors}
              onRefresh={refreshState}
            />
          )}

          {/* TAB 5: EXECUTORS */}
          {activeTab === "executors" && (
            <OperationalViews
              activeTab="executors"
              workflows={workflows}
              reservations={reservations}
              executors={executors}
              onRefresh={refreshState}
            />
          )}

          {/* TAB 6: ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-7">
              <KpiGrid metrics={metrics} events={events} />
              <PrimaryAnalytics
                events={events}
                metrics={metrics}
                selectedEvent={selected}
                onSelectEvent={(evt) => setSelected(evt)}
                onRunPipeline={runFor}
                running={running}
              />
              <SecondaryAnalytics events={events} />
            </div>
          )}

          {/* TAB 7: AUDIT LOGS */}
          {activeTab === "audit" && (
            <OperationalViews
              activeTab="audit"
              workflows={workflows}
              reservations={reservations}
              executors={executors}
              onRefresh={refreshState}
            />
          )}

          {/* TAB 8: SETTINGS */}
          {activeTab === "settings" && (
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0f1422] p-6 max-w-2xl space-y-5">
              <h3 className="font-heading text-base font-bold text-slate-900 dark:text-white">
                RecoverIQ Configuration & Boundaries
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">AI Diagnostic Engine</div>
                    <div className="text-slate-400">Gemini 2.5 Flash / 3.6 Flash structured JSON</div>
                  </div>
                  <span className="text-[10px] font-bold font-mono-ui bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">
                    ACTIVE
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Policy Safeguards</div>
                    <div className="text-slate-400">Deterministic gate enforcement (Idempotency, Confidence, Limits)</div>
                  </div>
                  <span className="text-[10px] font-bold font-mono-ui bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">
                    ENFORCED
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">State Repository</div>
                    <div className="text-slate-400">SQLite WAL mode (idempotency.db)</div>
                  </div>
                  <span className="text-[10px] font-bold font-mono-ui bg-blue-500/10 text-blue-500 px-2 py-1 rounded">
                    SYNCHRONIZED
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Global Product Footer */}
        <footer className="border-t border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-[#07090e]/40 py-5 px-6 mt-12 text-center text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1520px] mx-auto">
            <span>
              RecoverIQ • Autonomous Revenue Recovery Intelligence • Powered by Gemini & Policy Engine
            </span>
            <span className="text-[11px] text-slate-400">
              Deterministic Safety Invariant: AI Diagnoses • Policy Controls • Executor Acts
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
