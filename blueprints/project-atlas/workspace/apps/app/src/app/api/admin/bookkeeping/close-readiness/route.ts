import { resolveBookkeepingRuntime } from "@/lib/bookkeeping/runtime";

import { admitClientBookkeepingRequest } from "../../../client/bookkeeping/admission";

const privateHeaders = {
  "Cache-Control": "private, no-store",
};

export async function GET(request: Request) {
  const runtime = resolveBookkeepingRuntime();
  if (runtime.kind !== "ready") {
    return Response.json(
      { error: "bookkeeping_unavailable" },
      { status: 503, headers: privateHeaders },
    );
  }
  const admitted = await admitClientBookkeepingRequest(request, runtime);
  if (admitted.kind !== "authorized") {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: privateHeaders });
  }
  const permission = await runtime.permissions.authorize({
    accountId: admitted.actor.accountId,
    assurance: admitted.actor.assurance,
    permission: "admin.bookkeeping.report",
  });
  if (permission.kind !== "allowed") {
    return Response.json({ error: "forbidden" }, { status: 403, headers: privateHeaders });
  }
  const url = new URL(request.url);
  const bookRef = url.searchParams.get("bookRef");
  const periodRef = url.searchParams.get("periodRef");
  if (!bookRef || !periodRef) {
    return Response.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders });
  }
  return Response.json(
    await runtime.gateway.getCloseReadiness({ actor: admitted.actor, bookRef, periodRef }),
    { headers: privateHeaders },
  );
}
