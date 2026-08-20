import type { APIRoute } from "astro";
import { desc, eq } from "drizzle-orm";
import { getAtlasDb, schema } from "@atlas/database";
import {
  jsonBadRequest,
  jsonConflict,
  jsonResponse,
  jsonServerError,
  parseBody,
  parseNumericId,
  requireAdminAccessWithMinimumRole,
} from "../_db";

export const prerender = false;

type CrmRow = {
  leads: typeof schema.crmLeads.$inferSelect;
  contacts: typeof schema.crmContacts.$inferSelect | null;
};

const pipeline = ["new", "qualified", "proposal", "won"] as const;
type Pipeline = (typeof pipeline)[number];

const parseLeadSource = (value: string): typeof schema.crmLeadSource.enumValues[number] => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "chat") return "web";
  if (["whatsapp", "phone", "referral", "partner", "other", "web"].includes(normalized)) {
    return normalized as typeof schema.crmLeadSource.enumValues[number];
  }
  return "web";
};

const mapCrmRow = (row: CrmRow) => {
  const lead = row.leads;
  const contact = row.contacts;
  return {
    id: String(lead.id),
    leadName: contact?.fullName || `Lead ${lead.id}`,
    service: lead.serviceInterest || "Credit",
    source: lead.source,
    owner: "Internal sales",
    nextAction: lead.notes || "Review next stage",
    stage: (lead.stage as Pipeline) || "new",
    status: lead.status,
    score: lead.score ?? 0,
    converted: !!lead.converted,
    createdAt: lead.createdAt?.toISOString(),
    updatedAt: lead.updatedAt?.toISOString(),
  };
};

const parseStage = (value: string | null | undefined) => {
  if (!value) return pipeline[0];
  return pipeline.includes(value) ? value : pipeline[0];
};

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const db = getAtlasDb();
    const rows = await db
      .select()
      .from(schema.crmLeads)
      .leftJoin(schema.crmContacts, eq(schema.crmLeads.contactId, schema.crmContacts.id))
      .orderBy(desc(schema.crmLeads.createdAt));

    return jsonResponse({ ok: true, items: rows.map(mapCrmRow) });
  } catch (error) {
    return jsonServerError("No se pudo cargar CRM", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  try {
  const payload = await parseBody(request);
  const leadName = String((payload as { leadName?: string })?.leadName || "").trim();
  const service = String((payload as { service?: string })?.service || "Credit").trim();
  const source = String((payload as { source?: string })?.source || "web");
  const nextAction = String((payload as { nextAction?: string })?.nextAction || "Define next action").trim();

    if (!leadName || !service) {
      return jsonBadRequest("leadName and service are required");
    }

    const db = getAtlasDb();
    const [contact] = await db
      .insert(schema.crmContacts)
      .values({
        fullName: leadName,
        preferredLanguage: "en",
      })
      .returning();

    const [lead] = await db
      .insert(schema.crmLeads)
      .values({
        contactId: contact.id,
        source: parseLeadSource(source),
        serviceInterest: service,
        stage: pipeline[0],
        notes: nextAction,
      })
      .returning();

    const row: CrmRow = {
      leads: lead,
      contacts: contact,
    };

    return jsonResponse({ ok: true, item: mapCrmRow(row) }, { status: 201 });
  } catch (error) {
    if (String((error as { message?: string })?.message || "").includes("23505")) {
      return jsonConflict("Duplicate record");
    }
    return jsonServerError("No se pudo crear registro CRM", { message: String(error?.message ?? error) });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const payload = await parseBody(request);
    const id = parseNumericId((payload as { id?: unknown })?.id);
    const action = String((payload as { action?: string })?.action || "");

    if (!id || !action) {
      return jsonBadRequest("id and action are required");
    }

    const db = getAtlasDb();
    const [current] = await db.select().from(schema.crmLeads).where(eq(schema.crmLeads.id, id));
    if (!current) {
      return jsonBadRequest("CRM entry not found");
    }

    if (action === "next") {
      const lead = { ...current, stage: parseStage(current.stage) };
      const next = pipeline[(pipeline.indexOf(lead.stage) + 1) % pipeline.length];
      const [updated] = await db
        .update(schema.crmLeads)
        .set({ stage: next, notes: "Review next stage", updatedAt: new Date() })
        .where(eq(schema.crmLeads.id, id))
        .returning();

      const [row] = await db
        .select()
        .from(schema.crmLeads)
        .leftJoin(schema.crmContacts, eq(schema.crmLeads.contactId, schema.crmContacts.id))
        .where(eq(schema.crmLeads.id, id));

      if (!row) {
        return jsonBadRequest("CRM entry not found after update");
      }

      return jsonResponse({ ok: true, item: mapCrmRow(row) });
    }

    return jsonBadRequest("Unsupported action");
  } catch (error) {
    return jsonServerError("No se pudo actualizar CRM", { message: String(error?.message ?? error) });
  }
};
