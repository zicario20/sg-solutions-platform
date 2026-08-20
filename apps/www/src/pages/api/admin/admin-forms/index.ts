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

type AdminForm = {
  id: string;
  code: string;
  name: string;
  type: string;
  service: string;
  status: "draft" | "under_review" | "published" | "paused" | "archived";
  version: number;
  requiresAuthentication: boolean;
  requiresInvitation: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

type AdminFormStatus = AdminForm["status"];

const STATUS_ORDER: AdminFormStatus[] = ["draft", "under_review", "published", "paused", "archived"];
const STORAGE_KEY = "admin-forms";

const INITIAL_FORMS: AdminForm[] = [
  {
    id: "form-def-1",
    code: "IL_LLC_INTAKE",
    name: "LLC formation intake",
    type: "service_intake",
    service: "Business",
    status: "published",
    version: 1,
    requiresAuthentication: true,
    requiresInvitation: false,
    createdAt: "2026-08-01T09:00:00Z",
    updatedAt: "2026-08-01T09:00:00Z",
    publishedAt: "2026-08-01T09:00:00Z",
  },
  {
    id: "form-def-2",
    code: "TAX_1040_INTAKE",
    name: "Taxes eligibility intake",
    type: "eligibility",
    service: "Taxes",
    status: "under_review",
    version: 2,
    requiresAuthentication: false,
    requiresInvitation: false,
    createdAt: "2026-08-03T10:30:00Z",
    updatedAt: "2026-08-05T11:10:00Z",
  },
];

const nextStatus = (status: AdminFormStatus): AdminFormStatus => {
  const index = STATUS_ORDER.indexOf(status);
  return (STATUS_ORDER[Math.min(index + 1, STATUS_ORDER.length - 1)] || STATUS_ORDER[0]) as AdminFormStatus;
};

const loadItems = (): AdminForm[] => {
  return getAdminDemoState<AdminForm[]>(STORAGE_KEY, INITIAL_FORMS);
};

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const rows = loadItems().sort((left, right) => {
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
    return jsonResponse({ ok: true, items: rows });
  } catch (error) {
    return jsonServerError("No se pudo cargar formularios", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await parseBody(request);
  const code = String((payload as { code?: string })?.code || "").trim();
  const name = String((payload as { name?: string })?.name || "").trim();
  const type = String((payload as { type?: string })?.type || "custom").trim();
  const service = String((payload as { service?: string })?.service || "Credit").trim();
  const requiresAuthentication = String((payload as { requiresAuthentication?: string | boolean })?.requiresAuthentication || "")
    .trim()
    .toLowerCase();
  const requiresInvitation = String((payload as { requiresInvitation?: string | boolean })?.requiresInvitation || "")
    .trim()
    .toLowerCase();

  if (!code || !name) {
    return jsonBadRequest("code and name are required");
  }

  try {
    const rows = loadItems();
    const now = new Date().toISOString();
    const form: AdminForm = {
      id: createAdminDemoId("form"),
      code,
      name,
      type,
      service,
      status: "draft",
      version: 1,
      requiresAuthentication: requiresAuthentication !== "false",
      requiresInvitation: requiresInvitation === "true",
      createdAt: now,
      updatedAt: now,
    };
    rows.push(form);
    setAdminDemoState(STORAGE_KEY, rows);
    return jsonResponse({ ok: true, item: form }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo crear formulario", { message: String(error?.message ?? error) });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await parseBody(request);
  const id = String((payload as { id?: string })?.id || "").trim();
  const action = String((payload as { action?: string })?.action || "").trim();

  if (!id || !action) {
    return jsonBadRequest("id and action are required");
  }

  try {
    const rows = loadItems();
    const current = rows.find((entry) => entry.id === id);
    if (!current) {
      return jsonBadRequest("form not found");
    }

    if (action === "draft") {
      current.status = "draft";
    } else if (action === "next") {
      if (current.status !== "archived") {
        current.status = nextStatus(current.status);
      }
    } else if (action === "publish") {
      current.status = "published";
      current.version += 1;
      current.publishedAt = new Date().toISOString();
    } else if (action === "archive") {
      current.status = "archived";
    } else {
      return jsonBadRequest("unsupported action");
    }

    current.updatedAt = new Date().toISOString();
    setAdminDemoState(STORAGE_KEY, rows);
    return jsonResponse({ ok: true, item: current });
  } catch (error) {
    return jsonServerError("No se pudo actualizar formulario", { message: String(error?.message ?? error) });
  }
};
