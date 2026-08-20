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

type IncidentStatus = "detected" | "triaging" | "mitigating" | "monitoring" | "resolved" | "closed";

type OperationsState = {
  readiness: Record<string, boolean>;
  incidents: Array<{
    id: string;
    title: string;
    severity: string;
    status: IncidentStatus;
    createdAt: string;
    updatedAt?: string;
    owner?: string;
    timeline?: string[];
  }>;
};

const STORAGE_KEY = "admin-operations";
const STATUS_ORDER: IncidentStatus[] = ["detected", "triaging", "mitigating", "monitoring", "resolved", "closed"];

const INITIAL_OPERATIONS: OperationsState = {
  readiness: {
    authMfa: true,
    paymentsProvider: true,
    documentQuarantine: true,
    aiGateway: false,
  },
  incidents: [
    {
      id: "inc-1",
      title: "Document queue backlog",
      severity: "medium",
      status: "resolved",
      createdAt: "2026-08-08T13:20:00Z",
      owner: "Operations",
      timeline: ["Detected in task monitor.", "Review assignment redistributed."],
    },
  ],
};

const loadState = (): OperationsState => getAdminDemoState(STORAGE_KEY, INITIAL_OPERATIONS);

const nextStatus = (status: IncidentStatus): IncidentStatus => {
  const index = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[Math.min(index + 1, STATUS_ORDER.length - 1)] || STATUS_ORDER[0];
};

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) return unauthorized;

  try {
    const item = { ...loadState() };
    return jsonResponse({ ok: true, item });
  } catch (error) {
    return jsonServerError("No se pudo cargar operaciones", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) return unauthorized;

  const payload = await parseBody(request);
  const title = String((payload as { title?: string })?.title || "").trim();
  const severity = String((payload as { severity?: string })?.severity || "medium").trim();

  if (!title) {
    return jsonBadRequest("title is required");
  }

  try {
    const state = loadState();
    const incident = {
      id: `incident-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`,
      title,
      severity,
      status: "detected" as IncidentStatus,
      createdAt: new Date().toISOString(),
      owner: "Operations",
      timeline: ["Incident logged in local queue."],
    };
    state.incidents = state.incidents || [];
    state.incidents.push(incident);
    if (state.readiness && state.readiness.authMfa === undefined) {
      state.readiness.authMfa = true;
    }
    setAdminDemoState(STORAGE_KEY, state);
    return jsonResponse({ ok: true, item: state }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo crear incidencia", { message: String(error?.message ?? error) });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) return unauthorized;

  const payload = await parseBody(request);
  const action = String((payload as { action?: string })?.action || "").trim();

  if (!action) {
    return jsonBadRequest("action is required");
  }

  try {
    const state = loadState();
    state.readiness = state.readiness || {};
    state.incidents = state.incidents || [];

    if (action === "toggle-readiness") {
      const key = String((payload as { key?: string })?.key || "").trim();
      if (!key) {
        return jsonBadRequest("key is required");
      }
      state.readiness[key] = !state.readiness[key];
      setAdminDemoState(STORAGE_KEY, state);
      return jsonResponse({ ok: true, item: state });
    }

    const id = String((payload as { id?: string })?.id || "").trim();
    if (!id) {
      return jsonBadRequest("id is required");
    }
    const incident = state.incidents.find((entry) => entry.id === id);
    if (!incident) {
      return jsonBadRequest("incident not found");
    }

    if (action === "advance") {
      incident.status = nextStatus(incident.status);
    } else if (action === "close") {
      incident.status = "closed";
    } else {
      return jsonBadRequest("unsupported action");
    }

    incident.updatedAt = new Date().toISOString();
    setAdminDemoState(STORAGE_KEY, state);
    return jsonResponse({ ok: true, item: state });
  } catch (error) {
    return jsonServerError("No se pudo actualizar operaciones", { message: String(error?.message ?? error) });
  }
};
