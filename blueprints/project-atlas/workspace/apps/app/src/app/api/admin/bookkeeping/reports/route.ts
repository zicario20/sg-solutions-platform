import { resolveBookkeepingRuntime } from "@/lib/bookkeeping/runtime";

import { admitClientBookkeepingRequest } from "../../../client/bookkeeping/admission";

const privateHeaders = {
  "Cache-Control": "private, no-store",
};

const invalid = () =>
  Response.json({ error: "invalid_request" }, { status: 400, headers: privateHeaders });

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
  if (!bookRef) return invalid();

  const report = url.searchParams.get("report") ?? "trial_balance";
  switch (report) {
    case "trial_balance":
      return Response.json(
        await runtime.gateway.getTrialBalance({ actor: admitted.actor, bookRef }),
        { headers: privateHeaders },
      );
    case "profit_and_loss":
      return Response.json(
        await runtime.gateway.getProfitAndLoss({ actor: admitted.actor, bookRef }),
        { headers: privateHeaders },
      );
    case "balance_sheet":
      return Response.json(
        await runtime.gateway.getBalanceSheet({ actor: admitted.actor, bookRef }),
        { headers: privateHeaders },
      );
    case "general_ledger": {
      const requestedLimit = Number(url.searchParams.get("limit") ?? "100");
      if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 250)
        return invalid();
      return Response.json(
        await runtime.gateway.getGeneralLedger({
          actor: admitted.actor,
          bookRef,
          limit: requestedLimit,
        }),
        { headers: privateHeaders },
      );
    }
    default:
      return invalid();
  }
}
