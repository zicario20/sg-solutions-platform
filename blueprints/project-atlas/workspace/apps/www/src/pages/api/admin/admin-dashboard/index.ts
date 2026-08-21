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

type DashboardMetrics = {
  services: number;
  leads: number;
  appointments: number;
  pendingInvoices: number;
  missingDocuments: number;
  messages: number;
};

type DashboardActivity = {
  leadsAdmin: number;
  openOrders: number;
  activeClients: number;
};

type AdminDashboardState = {
  metrics: DashboardMetrics;
  activity: DashboardActivity;
  updatedAt: string;
};

const STORAGE_KEY = "admin-dashboard";
const INITIAL_DASHBOARD: AdminDashboardState = {
  metrics: {
    services: 0,
    leads: 0,
    appointments: 0,
    pendingInvoices: 0,
    missingDocuments: 0,
    messages: 0,
  },
  activity: {
    leadsAdmin: 0,
    openOrders: 0,
    activeClients: 0,
  },
  updatedAt: new Date().toISOString(),
};

const loadState = (): AdminDashboardState => {
  const state = getAdminDemoState(STORAGE_KEY, INITIAL_DASHBOARD);
  if (!state.updatedAt) {
    state.updatedAt = new Date().toISOString();
  }
  return state;
};

const asObject = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const asNumber = (value: unknown, fallback: number): number => {
  const candidate = Number(value);
  return Number.isFinite(candidate) ? candidate : fallback;
};

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const item = { ...loadState() };
    return jsonResponse({ ok: true, item });
  } catch (error) {
    return jsonServerError("No se pudo cargar dashboard", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await parseBody(request);
  const metrics = asObject((payload as { metrics?: unknown }).metrics);
  const activity = asObject((payload as { activity?: unknown }).activity);

  if (!metrics && !activity) {
    return jsonBadRequest("metrics or activity are required");
  }

  try {
    const state = loadState();
    const next: AdminDashboardState = {
      metrics: {
        services: asNumber(metrics?.services ?? state.metrics.services, state.metrics.services),
        leads: asNumber(metrics?.leads ?? state.metrics.leads, state.metrics.leads),
        appointments: asNumber(metrics?.appointments ?? state.metrics.appointments, state.metrics.appointments),
        pendingInvoices: asNumber(metrics?.pendingInvoices ?? state.metrics.pendingInvoices, state.metrics.pendingInvoices),
        missingDocuments: asNumber(metrics?.missingDocuments ?? state.metrics.missingDocuments, state.metrics.missingDocuments),
        messages: asNumber(metrics?.messages ?? state.metrics.messages, state.metrics.messages),
      },
      activity: {
        leadsAdmin: asNumber(activity?.leadsAdmin ?? state.activity.leadsAdmin, state.activity.leadsAdmin),
        openOrders: asNumber(activity?.openOrders ?? state.activity.openOrders, state.activity.openOrders),
        activeClients: asNumber(activity?.activeClients ?? state.activity.activeClients, state.activity.activeClients),
      },
      updatedAt: new Date().toISOString(),
    };

    setAdminDemoState(STORAGE_KEY, next);
    return jsonResponse({ ok: true, item: next }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo actualizar dashboard", { message: String(error?.message ?? error) });
  }
};
