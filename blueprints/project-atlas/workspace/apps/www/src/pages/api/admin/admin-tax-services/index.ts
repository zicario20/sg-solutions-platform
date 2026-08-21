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

type Filing = {
  id: string;
  client: string;
  returnType: string;
  year: number;
  status: "pending_documents" | "in_progress" | "review" | "ready_to_file" | "archived";
  dueAt: string;
  owner: string;
  lastAction: string;
  risk: "low" | "medium" | "high";
};

type TaxState = {
  filings: Filing[];
  tasks: Array<{
    id: string;
    filingId: string;
    owner: string;
    description: string;
    status: string;
  }>;
};

const STORAGE_KEY = "admin-tax-services";
const STATUS_ORDER: Filing["status"][] = ["pending_documents", "in_progress", "review", "ready_to_file", "archived"];

const INITIAL_TAX: TaxState = {
  filings: [
    {
      id: "tax-1",
      client: "Ana Perez",
      returnType: "US 1040 individual",
      year: 2025,
      status: "in_progress",
      dueAt: "2026-04-15",
      owner: "Tax team",
      lastAction: "W-2 documents collected.",
      risk: "medium",
    },
    {
      id: "tax-2",
      client: "Acme LLC",
      returnType: "LLC 1065",
      year: 2025,
      status: "pending_documents",
      dueAt: "2026-03-15",
      owner: "Tax team",
      lastAction: "Initial setup received.",
      risk: "low",
    },
  ],
  tasks: [],
};

const nextStatus = (status: Filing["status"]) => {
  const index = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[Math.min(index + 1, STATUS_ORDER.length - 2)] || STATUS_ORDER[0];
};

const loadState = (): TaxState => getAdminDemoState(STORAGE_KEY, INITIAL_TAX);

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) return unauthorized;

  try {
    const item = { ...loadState() };
    return jsonResponse({ ok: true, item });
  } catch (error) {
    return jsonServerError("No se pudo cargar servicios tributarios", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) return unauthorized;

  const payload = await parseBody(request);
  const client = String((payload as { client?: string })?.client || "").trim();
  const returnType = String((payload as { returnType?: string })?.returnType || "1040").trim();
  const year = Number((payload as { year?: number | string })?.year ?? new Date().getFullYear());

  if (!client || !returnType || !Number.isFinite(year)) {
    return jsonBadRequest("client, returnType and year are required");
  }

  try {
    const state = loadState();
    const filing: Filing = {
      id: createAdminDemoId("tax"),
      client,
      returnType,
      year,
      status: "pending_documents",
      dueAt: "2026-04-15",
      owner: "Tax team",
      lastAction: "Tax filing opened in local demo.",
      risk: returnType.includes("S") ? "high" : "medium",
    };
    state.filings = state.filings || [];
    state.filings.push(filing);
    setAdminDemoState(STORAGE_KEY, state);
    return jsonResponse({ ok: true, item: filing }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo crear filing", { message: String(error?.message ?? error) });
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
    const state = loadState();
    state.filings = state.filings || [];
    const filing = state.filings.find((entry) => entry.id === id);
    if (!filing) {
      return jsonBadRequest("filing not found");
    }

    if (action === "advance") {
      filing.status = nextStatus(filing.status);
      filing.lastAction = "Tax status advanced.";
    } else if (action === "archive") {
      filing.status = "archived";
      filing.lastAction = "Tax filing archived in demo.";
    } else {
      return jsonBadRequest("unsupported action");
    }

    setAdminDemoState(STORAGE_KEY, state);
    return jsonResponse({ ok: true, item: filing });
  } catch (error) {
    return jsonServerError("No se pudo actualizar filing", { message: String(error?.message ?? error) });
  }
};
