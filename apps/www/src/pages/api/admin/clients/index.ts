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

const mapClient = (client: typeof schema.crmClients.$inferSelect) => ({
  id: String(client.id),
  name: client.name,
  email: client.email ?? "",
  services: client.services,
  caseStatus: client.caseStatus,
  note: client.note ?? "",
  createdAt: client.createdAt?.toISOString(),
  updatedAt: client.updatedAt?.toISOString(),
});

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const db = getAtlasDb();
    const clients = await db.select().from(schema.crmClients).orderBy(desc(schema.crmClients.createdAt));
    return jsonResponse({ ok: true, items: clients.map(mapClient) });
  } catch (error) {
    return jsonServerError("No se pudo cargar clientes", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await parseBody(request);
  try {
    const name = String((payload as { name?: string })?.name || "").trim();
    const email = String((payload as { email?: string })?.email || "").trim();
    const services = String((payload as { services?: string })?.services || "General").trim();
    const caseStatus = String((payload as { caseStatus?: string })?.caseStatus || "under review").trim();
    const note = String((payload as { note?: string })?.note || "").trim();

    if (!name) {
      return jsonBadRequest("name is required");
    }

    const db = getAtlasDb();
    const [client] = await db
      .insert(schema.crmClients)
      .values({
        name,
        email: email || null,
        services,
        caseStatus,
        note,
      })
      .returning();

    return jsonResponse({ ok: true, item: mapClient(client) }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo crear cliente", { message: String(error?.message ?? error) });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await parseBody(request);
  const id = parseNumericId((payload as { id?: unknown })?.id);
  const patch = payload as { caseStatus?: string; note?: string } | null;
  if (!id) {
    return jsonBadRequest("id is required");
  }

  try {
    const db = getAtlasDb();
    const updates = {
      caseStatus: patch?.caseStatus ? String(patch.caseStatus) : undefined,
      note: patch?.note ? String(patch.note) : undefined,
      updatedAt: new Date(),
    };
    const [client] = await db.update(schema.crmClients).set(updates).where(eq(schema.crmClients.id, id)).returning();

    if (!client) {
      return jsonBadRequest("client not found");
    }

    return jsonResponse({ ok: true, item: mapClient(client) });
  } catch (error) {
    return jsonServerError("No se pudo actualizar cliente", { message: String(error?.message ?? error) });
  }
};
