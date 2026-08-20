import type { APIRoute } from "astro";
import { getAdminDemoState, setAdminDemoState } from "../_adminDemoStore";
import {
  jsonBadRequest,
  jsonResponse,
  jsonServerError,
  parseBody,
  requireAdminAccessWithMinimumRole,
} from "../_db";

export const prerender = false;

type Snapshot = {
  id: string;
  metric: string;
  value: number;
  unit: string;
  target: number;
  segment: string;
  status: string;
  observedAt: string;
  trend: string;
};

type AnalyticsState = {
  snapshots: Snapshot[];
  notes: string[];
};

const STORAGE_KEY = "admin-analytics";
const INITIAL_ANALYTICS: AnalyticsState = {
  snapshots: [
    {
      id: "an-1",
      metric: "Resolution time",
      value: 4.8,
      unit: "days",
      target: 5,
      segment: "Collections",
      status: "on_track",
      observedAt: "2026-08-10T00:00:00Z",
      trend: "positive",
    },
    {
      id: "an-2",
      metric: "New leads",
      value: 27,
      unit: "cases",
      target: 25,
      segment: "Channels",
      status: "good",
      observedAt: "2026-08-12T00:00:00Z",
      trend: "neutral",
    },
  ],
  notes: ["Load trend is improving and operational risk stays stable."],
};

const loadState = (): AnalyticsState => getAdminDemoState(STORAGE_KEY, INITIAL_ANALYTICS);

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) return unauthorized;

  try {
    const item = { ...loadState() };
    return jsonResponse({ ok: true, item });
  } catch (error) {
    return jsonServerError("No se pudo cargar analítica", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) return unauthorized;

  const payload = await parseBody(request);
  const metric = String((payload as { metric?: string })?.metric || "").trim();
  const status = String((payload as { status?: string })?.status || "good").trim();
  const segment = String((payload as { segment?: string })?.segment || "General").trim();
  const value = Number((payload as { value?: number | string })?.value ?? 0);

  if (!metric || !Number.isFinite(value)) {
    return jsonBadRequest("metric and value are required");
  }

  try {
    const state = loadState();
    state.snapshots = state.snapshots || [];
    const snapshot: Snapshot = {
      id: `an-${Date.now()}`,
      metric,
      value,
      unit: "units",
      target: value + 1,
      segment,
      status,
      observedAt: new Date().toISOString(),
      trend: "neutral",
    };
    state.snapshots.push(snapshot);
    setAdminDemoState(STORAGE_KEY, state);
    return jsonResponse({ ok: true, item: snapshot }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo crear snapshot", { message: String(error?.message ?? error) });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) return unauthorized;

  const payload = await parseBody(request);
  const action = String((payload as { action?: string })?.action || "").trim();
  const id = String((payload as { id?: string })?.id || "").trim();

  if (!id || !action) {
    return jsonBadRequest("id and action are required");
  }

  try {
    const state = loadState();
    if (action !== "remove") {
      return jsonBadRequest("unsupported action");
    }

    state.snapshots = state.snapshots || [];
    const before = state.snapshots.length;
    state.snapshots = state.snapshots.filter((entry) => entry.id !== id);
    if (state.snapshots.length === before) {
      return jsonBadRequest("snapshot not found");
    }

    setAdminDemoState(STORAGE_KEY, state);
    return jsonResponse({ ok: true, item: state });
  } catch (error) {
    return jsonServerError("No se pudo actualizar analítica", { message: String(error?.message ?? error) });
  }
};
