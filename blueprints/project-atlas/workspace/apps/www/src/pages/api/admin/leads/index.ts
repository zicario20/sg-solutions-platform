import type { APIRoute } from "astro";
import { desc, eq } from "drizzle-orm";
import { getAtlasDb, schema } from "@atlas/database";
import {
  jsonBadRequest,
  jsonResponse,
  jsonServerError,
  parseBody,
  parseNumericId,
  requireAdminAccessWithMinimumRole,
} from "../_db";

export const prerender = false;

const mapLead = (lead: typeof schema.crmLeadManagement.$inferSelect) => ({
  id: String(lead.id),
  name: lead.name,
  service: lead.service,
  source: lead.source === "phone" ? "phone" : lead.source || "chat",
  status: lead.status === "new" ? "new" : lead.status === "follow_up" ? "follow-up" : lead.status,
  score: lead.score,
  converted: !!lead.converted,
  summary: lead.summary || "",
  createdAt: lead.createdAt?.toISOString(),
  updatedAt: lead.updatedAt?.toISOString(),
});

const toStatus = (value: string): "new" | "follow_up" | "qualified" | "converted" => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["follow_up", "follow-up"].includes(normalized)) return "follow_up";
  if (normalized === "qualified") return "qualified";
  if (normalized === "converted") return "converted";
  return "new";
};

const toSource = (value: string): typeof schema.crmLeadManagementSource.enumValues[number] => {
  const normalized = String(value || "").trim().toLowerCase();
  if (["chat", "phone", "whatsapp", "referral", "partner", "other"].includes(normalized)) {
    return normalized as typeof schema.crmLeadManagementSource.enumValues[number];
  }
  return "chat";
};

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const db = getAtlasDb();
    const rows = await db.select().from(schema.crmLeadManagement).orderBy(desc(schema.crmLeadManagement.createdAt));
    return jsonResponse({ ok: true, items: rows.map(mapLead) });
  } catch (error) {
    return jsonServerError("No se pudo cargar leads", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await parseBody(request);
  const name = String((payload as { name?: string })?.name || "").trim();
  const service = String((payload as { service?: string })?.service || "Credit").trim();
  const source = String((payload as { source?: string })?.source || "chat").trim();
  const status = toStatus(String((payload as { status?: string })?.status || "new"));
  const score = Number((payload as { score?: number })?.score ?? 60);
  const summary = String((payload as { summary?: string })?.summary || "").trim();

  if (!name) {
    return jsonBadRequest("name is required");
  }

  try {
    const db = getAtlasDb();
    const [lead] = await db
      .insert(schema.crmLeadManagement)
      .values({
        name,
        service,
        source: toSource(source),
        status,
        score,
        summary,
      })
      .returning();

    return jsonResponse({ ok: true, item: mapLead(lead) }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo crear lead", { message: String(error?.message ?? error) });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await parseBody(request);
  const id = parseNumericId((payload as { id?: unknown })?.id);
  const action = String((payload as { action?: string })?.action || "");

  if (!id || !action) {
    return jsonBadRequest("id and action are required");
  }

  try {
    const db = getAtlasDb();
    if (action === "convert") {
      const [lead] = await db
        .update(schema.crmLeadManagement)
        .set({ converted: 1, status: "converted", updatedAt: new Date() })
        .where(eq(schema.crmLeadManagement.id, id))
        .returning();

      if (!lead) {
        return jsonBadRequest("lead not found");
      }

      return jsonResponse({ ok: true, item: mapLead(lead) });
    }

    return jsonBadRequest("Unsupported action");
  } catch (error) {
    return jsonServerError("No se pudo actualizar lead", { message: String(error?.message ?? error) });
  }
};
