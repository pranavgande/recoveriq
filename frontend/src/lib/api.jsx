/**
 * api.jsx
 *
 * RecoverIQ API Client
 */
import axios from "axios";

const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API, timeout: 25000 });

export const api = {
  listEvents: (limit = 60) => client.get(`/events?limit=${limit}`).then((r) => r.data.events),
  newEvent: () => client.post(`/events/new`).then((r) => r.data),
  runPipeline: (event) =>
    client.post(`/pipeline/run`, { event }).then((r) => r.data),
  reservations: () =>
    client.get(`/state/reservations`).then((r) => r.data.rows),
  executors: () => client.get(`/state/executors`).then((r) => r.data.rows),
  metrics: () => client.get(`/metrics`).then((r) => r.data),
  workflows: (limit = 20) => client.get(`/workflows?limit=${limit}`).then((r) => r.data.workflows),
  workflow: (id) => client.get(`/workflow/${id}`).then((r) => r.data),
  reset: () => client.post(`/state/reset`).then((r) => r.data),
  failure: {
    concurrent: () =>
      client.post(`/failure/concurrent-webhooks`).then((r) => r.data),
    stale: () => client.post(`/failure/stale-reservation`).then((r) => r.data),
    duplicate: () =>
      client.post(`/failure/duplicate-executor`).then((r) => r.data),
  },
};

export const fmtINR = (amountOrPaise, isPaise = true) => {
  const rupees = isPaise ? (amountOrPaise || 0) / 100 : (amountOrPaise || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
};

export const fmtINRRaw = (rupees) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees || 0);
};

export const shortId = (s, n = 10) =>
  s ? s.slice(0, n) + (s.length > n ? "…" : "") : "—";

export const timeAgo = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const sec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};
