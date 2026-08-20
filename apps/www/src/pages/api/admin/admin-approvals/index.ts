import type { APIRoute } from "astro";
import { createAdminDemoId, getAdminDemoState, setAdminDemoState } from "../_adminDemoStore";
import {
  jsonBadRequest,
  jsonResponse,
  jsonServerError,
  parseBody,
  requireAdminAccessWithMinimumRole,
} from "../_db";

export const prerender = false;

type ApprovalRisk = "low" | "medium" | "high";
type ApprovalStatus = "pending" | "approved" | "rejected" | "info_requested" | "closed";

type ApprovalItem = {
  id: string;
  request: string;
  objective: string;
  risk: ApprovalRisk;
  owner: string;
  status: ApprovalStatus;
  requestedAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "admin-approvals";
const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: "appr-1",
    request: "Activate onboarding checklist",
    objective: "Allow workflow for new client",
    risk: "medium",
    owner: "Admin supervisor",
    status: "pending",
    requestedAt: "2026-08-09T12:00:00Z",
    updatedAt: "2026-08-09T12:00:00Z",
  },
  {
    id: "appr-2",
    request: "Update document template",
    objective: "Adjust signature validation",
    risk: "high",
    owner: "Compliance lead",
    status: "info_requested",
    requestedAt: "2026-08-10T11:15:00Z",
    updatedAt: "2026-08-10T11:15:00Z",
  },
];

const normalizeRisk = (value: string): ApprovalRisk => {
  const candidate = String(value || "").trim().toLowerCase();
  return candidate === "low" || candidate === "medium" || candidate === "high" ? candidate : "low";
};

const loadItems = () => getAdminDemoState<ApprovalItem[]>(STORAGE_KEY, INITIAL_APPROVALS);

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) return unauthorized;

  try {
    const items = [...loadItems()];
    return jsonResponse({ ok: true, items });
  } catch (error) {
    return jsonServerError("No se pudo cargar aprobaciones", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) return unauthorized;

  const payload = await parseBody(request);
  const requestText = String((payload as { request?: string })?.request || "").trim();
  const objective = String((payload as { objective?: string })?.objective || "").trim();
  const risk = normalizeRisk(String((payload as { risk?: string })?.risk || ""));

  if (!requestText || !objective) {
    return jsonBadRequest("request and objective are required");
  }

  try {
    const items = loadItems();
    const now = new Date().toISOString();
    const item: ApprovalItem = {
      id: createAdminDemoId("approval"),
      request: requestText,
      objective,
      risk,
      owner: "Admin manager",
      status: "pending",
      requestedAt: now,
      updatedAt: now,
    };
    items.push(item);
    setAdminDemoState(STORAGE_KEY, items);
    return jsonResponse({ ok: true, item }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo crear aprobación", { message: String(error?.message ?? error) });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) return unauthorized;

  const payload = await parseBody(request);
  const id = String((payload as { id?: string })?.id || "").trim();
  const action = String((payload as { action?: string })?.action || "").trim();

  if (!id || !action) {
    return jsonBadRequest("id and action are required");
  }

  try {
    const items = loadItems();
    const current = items.find((entry) => entry.id === id);
    if (!current) {
      return jsonBadRequest("approval not found");
    }

    if (action === "approve") {
      current.status = "approved";
    } else if (action === "reject") {
      current.status = "rejected";
    } else if (action === "request") {
      current.status = "info_requested";
    } else if (action === "close") {
      current.status = "closed";
    } else {
      return jsonBadRequest("unsupported action");
    }
    current.updatedAt = new Date().toISOString();
    setAdminDemoState(STORAGE_KEY, items);
    return jsonResponse({ ok: true, item: current });
  } catch (error) {
    return jsonServerError("No se pudo actualizar aprobación", { message: String(error?.message ?? error) });
  }
};
