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

type AITaskStatus = "complete" | "closed" | string;

type AIRun = {
  id: string;
  skill: string;
  input: string;
  status: AITaskStatus;
  confidence: number;
  result: string;
  startedAt: string;
  completedAt: string;
};

type AIAIState = AIRun[];

const STORAGE_KEY = "admin-ai-hub";
const INITIAL_AI_RUNS: AIRun[] = [
  {
    id: "airun-1",
    skill: "intake-router",
    input: "Credit + mortgage intake pre-routing",
    status: "complete",
    confidence: 95,
    result: "Suggested route: credit + tax precheck.",
    startedAt: "2026-08-11T07:35:00Z",
    completedAt: "2026-08-11T07:35:05Z",
  },
];

const asString = (value: unknown, fallback = ""): string => {
  const normalized = String(value ?? "").trim();
  return normalized.length ? normalized : fallback;
};

const runResult = (skill: string, input: string, language: "es" | "en") => {
  const isSpanish = language === "es";
  const keyLength = input.length;
  const confidence = Math.max(20, 100 - Math.max(0, keyLength - 20) * 2);
  const normalizedSkill = skill.trim();
  if (normalizedSkill === "risk-summarizer") {
    return isSpanish ? `Riesgo medio: faltan fuentes adicionales. ${Math.max(20, confidence)}%` : `Medium risk: more source context needed. ${confidence}%`;
  }
  if (normalizedSkill === "form-completeness") {
    return isSpanish ? `Completitud estimada: requiere 2 campos clave. ${confidence}%` : `Estimated completeness: 2 key fields missing. ${confidence}%`;
  }
  return isSpanish ? `Enrutamiento sugerido por skill ${normalizedSkill}.` : `Skill ${normalizedSkill} generated a local action plan.`;
};

const predictConfidence = (input = ""): number => Math.max(20, 100 - Math.max(0, String(input).length - 20) * 2);

const loadItems = (): AIAIState => getAdminDemoState<AIAIState>(STORAGE_KEY, INITIAL_AI_RUNS);

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const runs = loadItems().map((run) => {
      if (typeof run.confidence === "number") {
        return run;
      }
      return { ...run, confidence: predictConfidence(run.input) };
    });
    return jsonResponse({ ok: true, items: runs });
  } catch (error) {
    return jsonServerError("No se pudo cargar ejecuciones IA", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await parseBody(request);
  const skill = asString((payload as { skill?: unknown })?.skill, "intake-router");
  const input = asString((payload as { input?: unknown })?.input, "Empty input");
  const language = String(request.headers.get("accept-language") ?? "en").toLowerCase().startsWith("es") ? "es" : "en";
  const now = new Date().toISOString();
  const confidence = predictConfidence(input);

  try {
    const rows = loadItems();
    const created: AIRun = {
      id: createAdminDemoId("run"),
      skill,
      input,
      status: "complete",
      confidence,
      result: runResult(skill, input, language),
      startedAt: now,
      completedAt: now,
    };
    rows.unshift(created);
    if (rows.length > 30) rows.length = 30;
    setAdminDemoState(STORAGE_KEY, rows);
    return jsonResponse({ ok: true, item: created }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo crear ejecución IA", { message: String(error?.message ?? error) });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await parseBody(request);
  const id = asString((payload as { id?: unknown })?.id);
  const action = asString((payload as { action?: unknown })?.action);

  if (!id || !action) {
    return jsonBadRequest("id and action are required");
  }

  if (action !== "close") {
    return jsonBadRequest("unsupported action");
  }

  try {
    const rows = loadItems();
    const current = rows.find((entry) => entry.id === id);
    if (!current) {
      return jsonBadRequest("run not found");
    }

    current.status = "closed";
    current.completedAt = new Date().toISOString();
    setAdminDemoState(STORAGE_KEY, rows);
    return jsonResponse({ ok: true, item: current });
  } catch (error) {
    return jsonServerError("No se pudo actualizar ejecución IA", { message: String(error?.message ?? error) });
  }
};
