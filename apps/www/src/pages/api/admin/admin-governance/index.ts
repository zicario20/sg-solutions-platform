import type { APIRoute } from "astro";
import { getAdminDemoState, setAdminDemoState } from "../_adminDemoStore";
import { createAdminDemoId } from "../_adminDemoStore";
import {
  jsonBadRequest,
  jsonResponse,
  jsonServerError,
  parseBody,
  requireAdminAccessWithMinimumRole,
} from "../_db";

export const prerender = false;

type ControlRisk = "low" | "medium" | "high";
type ControlStatus = "ok" | "attention" | "blocked";

type GovernanceState = {
  checks: Record<string, boolean>;
  controls: Array<{
    id: string;
    area: string;
    status: ControlStatus;
    owner: string;
    risk: ControlRisk;
    nextReview: string;
    notes: string;
  }>;
};

const STORAGE_KEY = "admin-governance";

const INITIAL_GOVERNANCE: GovernanceState = {
  checks: {
    kyc: true,
    aml: false,
    sanctions: true,
    dataPrivacy: true,
  },
  controls: [
    {
      id: "gov-1",
      area: "Client and due diligence",
      status: "ok",
      owner: "Compliance",
      risk: "low",
      nextReview: "2026-10-01",
      notes: "Checklist complete with approved exceptions.",
    },
    {
      id: "gov-2",
      area: "Document management",
      status: "attention",
      owner: "Operations",
      risk: "medium",
      nextReview: "2026-09-10",
      notes: "Source refresh pending.",
    },
  ],
};

const loadState = (): GovernanceState => getAdminDemoState(STORAGE_KEY, INITIAL_GOVERNANCE);

const normalizeRisk = (value: string): ControlRisk => {
  const candidate = String(value || "").trim().toLowerCase();
  return candidate === "low" || candidate === "medium" || candidate === "high" ? candidate : "low";
};

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) return unauthorized;

  try {
    const item = { ...loadState() };
    return jsonResponse({ ok: true, item });
  } catch (error) {
    return jsonServerError("No se pudo cargar governance", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) return unauthorized;

  const payload = await parseBody(request);
  const area = String((payload as { area?: string })?.area || "").trim();
  const risk = normalizeRisk(String((payload as { risk?: string })?.risk || ""));

  if (!area) {
    return jsonBadRequest("area is required");
  }

  try {
    const state = loadState();
    state.controls = state.controls || [];
    const control = {
      id: createAdminDemoId("gov"),
      area,
      status: "attention" as ControlStatus,
      owner: "Compliance",
      risk,
      nextReview: "2026-09-30",
      notes: "New control logged for follow-up.",
    };
    state.controls.push(control);
    setAdminDemoState(STORAGE_KEY, state);
    return jsonResponse({ ok: true, item: state }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo crear control", { message: String(error?.message ?? error) });
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
    state.controls = state.controls || [];
    const control = state.controls.find((entry) => entry.id === id);
    if (!control) {
      return jsonBadRequest("control not found");
    }

    if (action === "toggle-control") {
      control.status = control.status === "ok" ? "attention" : "ok";
    } else if (action === "close-control") {
      control.status = "blocked";
    } else {
      return jsonBadRequest("unsupported action");
    }

    setAdminDemoState(STORAGE_KEY, state);
    return jsonResponse({ ok: true, item: state });
  } catch (error) {
    return jsonServerError("No se pudo actualizar control", { message: String(error?.message ?? error) });
  }
};
