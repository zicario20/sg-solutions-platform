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

type ContactRecord = Record<string, unknown>;

type AdminContactsState = {
  leads: ContactRecord[];
  whatsapp: ContactRecord[];
  phone: ContactRecord[];
};

const STORAGE_KEY = "admin-contacts";
const INITIAL_CONTACTS: AdminContactsState = {
  leads: [],
  whatsapp: [],
  phone: [],
};

const asObject = (value: unknown): ContactRecord | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as ContactRecord) : null;

const asString = (value: unknown, fallback = ""): string => {
  const normalized = String(value ?? "").trim();
  return normalized.length ? normalized : fallback;
};

const loadState = (): AdminContactsState => getAdminDemoState(STORAGE_KEY, INITIAL_CONTACTS);

const sanitizeKind = (value: unknown): "chat" | "whatsapp" | "phone" => {
  const candidate = asString(value, "chat").toLowerCase();
  if (candidate === "whatsapp") return "whatsapp";
  if (candidate === "phone") return "phone";
  return "chat";
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
    return jsonServerError("No se pudo cargar contactos", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await parseBody(request);
  const kind = sanitizeKind(payload.kind);
  const now = new Date().toISOString();
  const state = loadState();

  try {
    if (kind === "chat") {
      const sourceLead = asObject((payload as { lead?: unknown })?.lead) ?? {};
      const entry: ContactRecord = {
        id: createAdminDemoId("lead"),
        source: asString(sourceLead.source, "chat"),
        createdAt: now,
        service: asString(sourceLead.service, "Consulta general"),
        message: asString(sourceLead.message),
      };
      state.leads.push(entry);
      setAdminDemoState(STORAGE_KEY, state);
      return jsonResponse({ ok: true, item: entry }, { status: 201 });
    }

    if (kind === "whatsapp") {
      const sourceEntry = asObject((payload as { entry?: unknown })?.entry) ?? {};
      const entry: ContactRecord = {
        id: createAdminDemoId("wa"),
        type: asString(sourceEntry.type, asString(payload.type, "inbox")),
        label: asString(sourceEntry.label),
        message: asString(sourceEntry.message),
        time: asString(sourceEntry.time, now),
      };
      state.whatsapp.push(entry);
      setAdminDemoState(STORAGE_KEY, state);
      return jsonResponse({ ok: true, item: entry }, { status: 201 });
    }

    const sourceEntry = asObject((payload as { entry?: unknown })?.entry) ?? {};
    const entry: ContactRecord = {
      id: createAdminDemoId("call"),
      name: asString(sourceEntry.name),
      language: asString(sourceEntry.language, "es"),
      intent: asString(sourceEntry.intent),
      summary: asString(sourceEntry.summary, asString(sourceEntry.intent)),
      createdAt: asString(sourceEntry.createdAt, now),
    };
    state.phone.push(entry);
    setAdminDemoState(STORAGE_KEY, state);
    return jsonResponse({ ok: true, item: entry }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo guardar contacto", { message: String(error?.message ?? error) });
  }
};
