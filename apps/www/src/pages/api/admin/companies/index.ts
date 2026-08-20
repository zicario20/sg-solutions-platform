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

const mapCompany = (row: typeof schema.crmCompanies.$inferSelect) => ({
  id: String(row.id),
  name: row.name,
  type: row.type,
  status: row.status,
  ein: row.ein ?? "",
  state: row.state ?? "",
  formed: row.formed ?? "",
  industry: row.industry ?? "",
  createdAt: row.createdAt?.toISOString(),
  updatedAt: row.updatedAt?.toISOString(),
});

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) return unauthorized;

  try {
    const db = getAtlasDb();
    const rows = await db.select().from(schema.crmCompanies).orderBy(desc(schema.crmCompanies.createdAt));
    return jsonResponse({ ok: true, items: rows.map(mapCompany) });
  } catch (error) {
    return jsonServerError("No se pudo cargar empresas", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) return unauthorized;

  const payload = await parseBody(request);
  const name = String((payload as { name?: string })?.name || "").trim();
  const type = String((payload as { type?: string })?.type || "LLC").trim();
  const ein = String((payload as { ein?: string })?.ein || "").trim();
  const state = String((payload as { state?: string })?.state || "").trim();
  const status = String((payload as { status?: string })?.status || "active").trim();
  const industry = String((payload as { industry?: string })?.industry || "").trim();
  const formed = String((payload as { formed?: string })?.formed || "").trim();

  if (!name) {
    return jsonBadRequest("name is required");
  }

  try {
    const db = getAtlasDb();
    const [company] = await db
      .insert(schema.crmCompanies)
      .values({
        name,
        type,
        ein: ein || null,
        state: state || null,
        status,
        industry: industry || null,
        formed: formed || null,
      })
      .returning();

    return jsonResponse({ ok: true, item: mapCompany(company) }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo crear empresa", { message: String(error?.message ?? error) });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) return unauthorized;

  const payload = await parseBody(request);
  const id = parseNumericId((payload as { id?: unknown })?.id);
  if (!id) {
    return jsonBadRequest("id is required");
  }

  try {
    const db = getAtlasDb();
    const [company] = await db
      .update(schema.crmCompanies)
      .set({
        name: (payload as { name?: string })?.name ? String((payload as { name?: string }).name) : undefined,
        type: (payload as { type?: string })?.type ? String((payload as { type?: string }).type) : undefined,
        state: (payload as { state?: string })?.state ? String((payload as { state?: string }).state) : undefined,
        status: (payload as { status?: string })?.status ? String((payload as { status?: string }).status) : undefined,
        industry: (payload as { industry?: string })?.industry ? String((payload as { industry?: string }).industry) : undefined,
        formed: (payload as { formed?: string })?.formed ? String((payload as { formed?: string }).formed) : undefined,
        ein: (payload as { ein?: string })?.ein ? String((payload as { ein?: string }).ein) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(schema.crmCompanies.id, id))
      .returning();

    if (!company) {
      return jsonBadRequest("company not found");
    }

    return jsonResponse({ ok: true, item: mapCompany(company) });
  } catch (error) {
    return jsonServerError("No se pudo actualizar empresa", { message: String(error?.message ?? error) });
  }
};
