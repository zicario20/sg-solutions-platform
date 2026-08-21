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

type Tradeline = {
  id: string;
  client: string;
  partner: string;
  type: string;
  amount: number;
  currency: string;
  risk: string;
  status: "sourcing" | "offer_ready" | "funded" | "archived";
  requestedAt: string;
  owner: string;
  notes: string;
};

const STORAGE_KEY = "admin-tradelines";
const STATUS_ORDER: Tradeline["status"][] = ["sourcing", "offer_ready", "funded", "archived"];

const INITIAL_TRADELINES: Tradeline[] = [
  {
    id: "tl-1",
    client: "Maria Lopez",
    partner: "Atlas Capital",
    type: "Revolving",
    amount: 45000,
    currency: "USD",
    risk: "medium",
    status: "offer_ready",
    requestedAt: "2026-08-10T09:15:00Z",
    owner: "Marketplace team",
    notes: "Pre-approved pending signature.",
  },
  {
    id: "tl-2",
    client: "Carlos Rivas",
    partner: "Northline Finance",
    type: "Traditional",
    amount: 78000,
    currency: "USD",
    risk: "low",
    status: "sourcing",
    requestedAt: "2026-08-11T11:45:00Z",
    owner: "Back-office",
    notes: "Searching best-rate, best-term option.",
  },
];

const nextStatus = (status: Tradeline["status"]) => {
  const index = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[Math.min(index + 1, STATUS_ORDER.length - 1)] || STATUS_ORDER[0];
};

const loadItems = (): Tradeline[] => getAdminDemoState(STORAGE_KEY, INITIAL_TRADELINES);

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) return unauthorized;

  try {
    const items = [...loadItems()];
    return jsonResponse({ ok: true, items });
  } catch (error) {
    return jsonServerError("No se pudo cargar tradelines", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) return unauthorized;

  const payload = await parseBody(request);
  const client = String((payload as { client?: string })?.client || "").trim();
  const partner = String((payload as { partner?: string })?.partner || "").trim();
  const type = String((payload as { type?: string })?.type || "Revolving").trim();
  const amount = Number((payload as { amount?: number | string })?.amount ?? 0);

  if (!client || !partner || !Number.isFinite(amount)) {
    return jsonBadRequest("client, partner and amount are required");
  }

  try {
    const rows = loadItems();
    const row: Tradeline = {
      id: createAdminDemoId("tl"),
      client,
      partner,
      type,
      amount,
      currency: "USD",
      risk: "low",
      status: "sourcing",
      requestedAt: new Date().toISOString(),
      owner: "Marketplace team",
      notes: "Request created and queued for sourcing.",
    };
    rows.push(row);
    setAdminDemoState(STORAGE_KEY, rows);
    return jsonResponse({ ok: true, item: row }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo crear tradeline", { message: String(error?.message ?? error) });
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
    const rows = loadItems();
    const entry = rows.find((item) => item.id === id);
    if (!entry) {
      return jsonBadRequest("tradeline not found");
    }

    if (action === "advance") {
      entry.status = nextStatus(entry.status);
    } else if (action === "archive") {
      entry.status = "archived";
    } else {
      return jsonBadRequest("unsupported action");
    }

    entry.notes = "Updated from module action.";
    setAdminDemoState(STORAGE_KEY, rows);
    return jsonResponse({ ok: true, item: entry });
  } catch (error) {
    return jsonServerError("No se pudo actualizar tradeline", { message: String(error?.message ?? error) });
  }
};
