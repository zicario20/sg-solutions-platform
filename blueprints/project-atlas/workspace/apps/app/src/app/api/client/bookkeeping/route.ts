import { admitBookkeepingRequest, bookkeepingResponse } from "./admission.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const input = await admitBookkeepingRequest(request);
  if (input.kind === "unavailable")
    return bookkeepingResponse({ error: "temporarily_unavailable" }, 503);
  if (input.kind !== "authorized") return bookkeepingResponse({ error: "not_found" }, 404);
  return bookkeepingResponse({
    items: await input.runtime.gateway.listAuthorizedBooks({ actor: input.actor }),
  });
}

export async function POST(request: Request) {
  const input = await admitBookkeepingRequest(request);
  if (input.kind === "unavailable")
    return bookkeepingResponse({ error: "temporarily_unavailable" }, 503);
  if (input.kind !== "authorized") return bookkeepingResponse({ error: "not_found" }, 404);
  return bookkeepingResponse({ error: "bookkeeping_mutations_not_enabled" }, 405);
}
