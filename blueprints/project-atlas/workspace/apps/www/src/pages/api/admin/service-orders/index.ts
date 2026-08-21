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

const statusOrder = [
  "approval_pending",
  "in_progress",
  "waiting_documents",
  "closed",
];

const normalizeStatusForDb = (value: string): typeof schema.serviceOrderStatus.enumValues[number] => {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/ /g, "_");
  if (["approval_pending", "in_progress", "waiting_documents", "closed"].includes(normalized)) {
    return normalized as typeof schema.serviceOrderStatus.enumValues[number];
  }
  return "approval_pending";
};

const normalizeMoney = (value: unknown) => {
  const candidate = Number(String(value ?? "").trim());
  return Number.isFinite(candidate) ? Math.round(candidate) : 0;
};

const mapOrder = (order: typeof schema.crmServiceOrders.$inferSelect) => ({
  id: String(order.id),
  client: order.client,
  service: order.service,
  price: Number(order.price),
  discount: Number(order.discount),
  status: order.status,
  owner: order.owner,
  paid: !!order.paid,
  createdAt: order.createdAt?.toISOString(),
  updatedAt: order.updatedAt?.toISOString(),
});

const nextStatus = (status: string) => {
  const current = statusOrder.indexOf(status);
  if (current === -1) return statusOrder[0];
  return statusOrder[Math.min(current + 1, statusOrder.length - 1)];
};

export const GET: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "support");
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const db = getAtlasDb();
    const rows = await db.select().from(schema.crmServiceOrders).orderBy(desc(schema.crmServiceOrders.createdAt));
    return jsonResponse({ ok: true, items: rows.map(mapOrder) });
  } catch (error) {
    return jsonServerError("No se pudo cargar órdenes", { message: String(error?.message ?? error) });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const unauthorized = requireAdminAccessWithMinimumRole(request, "admin");
  if (unauthorized) {
    return unauthorized;
  }

  const payload = await parseBody(request);
  const client = String((payload as { client?: string })?.client || "").trim();
  const service = String((payload as { service?: string })?.service || "Credit").trim();
  const price = normalizeMoney((payload as { price?: unknown })?.price);
  const discount = normalizeMoney((payload as { discount?: unknown })?.discount);
  const owner = String((payload as { owner?: string })?.owner || "Service team").trim();
  const status = normalizeStatusForDb((payload as { status?: string })?.status || "approval_pending");

  if (!client || !service) {
    return jsonBadRequest("client and service are required");
  }

  try {
    const db = getAtlasDb();
    const [order] = await db
      .insert(schema.crmServiceOrders)
      .values({
        client,
        service,
        price,
        discount,
        status,
        owner,
      })
      .returning();

    return jsonResponse({ ok: true, item: mapOrder(order) }, { status: 201 });
  } catch (error) {
    return jsonServerError("No se pudo crear orden", { message: String(error?.message ?? error) });
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
    const statusValue = await db
      .select({ status: schema.crmServiceOrders.status })
      .from(schema.crmServiceOrders)
      .where(eq(schema.crmServiceOrders.id, id));
    if (!statusValue.length) {
      return jsonBadRequest("order not found");
    }

    if (action === "next") {
      const [order] = await db
        .update(schema.crmServiceOrders)
        .set({ status: nextStatus(statusValue[0].status), updatedAt: new Date() })
        .where(eq(schema.crmServiceOrders.id, id))
        .returning();
      return jsonResponse({ ok: true, item: mapOrder(order) });
    }

    if (action === "pay") {
      const [order] = await db
        .update(schema.crmServiceOrders)
        .set({ paid: 1, status: "in_progress", updatedAt: new Date() })
        .where(eq(schema.crmServiceOrders.id, id))
        .returning();
      return jsonResponse({ ok: true, item: mapOrder(order) });
    }

    return jsonBadRequest("Unsupported action");
  } catch (error) {
    return jsonServerError("No se pudo actualizar orden", { message: String(error?.message ?? error) });
  }
};
