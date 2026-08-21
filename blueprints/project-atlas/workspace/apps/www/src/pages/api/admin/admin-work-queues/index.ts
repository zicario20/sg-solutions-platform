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

type WorkQueue = {
  id: string;
  title: string;
  workflow: string;
  priority: string;
  status: "queued" | "in_progress" | "ready" | "resolved" | "closed";
  owner: string;
  createdAt: string;
  resolvedAt?: string;
};

const STORAGE_KEY = "admin-work-queues";
const STATUS_ORDER = ["queued", "in_progress", "ready", "resolved", "closed"] as const;
const INITIAL_WORK_QUEUES: WorkQueue[] = [
  {
    id: "wq-1",
    title: "Revisión de onboarding del lead",
    workflow: "intake",
    priority: "high",
    status: "queued",
    owner: "Comercial interno",
    createdAt: "2026-08-10T08:20:00Z",
  },
  {
    id: "wq-2",
    title: "Revisión de documentos pendientes",
    workflow: "compliance",
    priority: "medium",
    status: "in_progress",
    owner: "Cumplimiento",
    createdAt: "2026-08-11T14:05:00Z",
  },
];

const loadItems = () => getAdminDemoState<WorkQueue[]>(STORAGE_KEY, INITIAL_WORK_QUEUES);

const nextStatus = (current: WorkQueue["status"]) => {
  const index = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[Math.min(index + 1, STATUS_ORDER.length - 1)] || STATUS_ORDER[0];
};

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) return unauthorized;

  try {
    const items = [...loadItems()].sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
    return jsonResponse({ ok: true, items });
  } catch (error) {
    return jsonServerError("No se pudo cargar colas", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) return unauthorized;

  const payload = await parseBody(request);
  const title = String((payload as { title?: string })?.title || "").trim();
  const workflow = String((payload as { workflow?: string })?.workflow || "support").trim();
  const priority = String((payload as { priority?: string })?.priority || "medium").trim();

  if (!title) {
    return jsonBadRequest("title is required");
  }

  try {
    const items = loadItems();
    const queue: WorkQueue = {
      id: createAdminDemoId("queue"),
      title,
      workflow,
      priority,
      status: "queued",
      owner: "Queue team",
      createdAt: new Date().toISOString(),
    };
    items.push(queue);
    setAdminDemoState(STORAGE_KEY, items);
    return jsonResponse({ ok: true, item: queue }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo crear cola", { message: String(error?.message ?? error) });
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
      return jsonBadRequest("queue item not found");
    }

    if (action === "advance") {
      current.status = nextStatus(current.status);
      if (current.status === "resolved") {
        current.resolvedAt = new Date().toISOString();
      }
    } else {
      return jsonBadRequest("unsupported action");
    }

    setAdminDemoState(STORAGE_KEY, items);
    return jsonResponse({ ok: true, item: current });
  } catch (error) {
    return jsonServerError("No se pudo actualizar cola", { message: String(error?.message ?? error) });
  }
};
