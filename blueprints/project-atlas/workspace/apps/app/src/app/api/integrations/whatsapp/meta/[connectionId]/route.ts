import { whatsAppRuntimeHandler } from "../../../../../../lib/whatsapp/runtime.ts";

type RouteContext = {
  readonly params: Promise<{ readonly connectionId: string }>;
};

async function handle(request: Request, context: RouteContext): Promise<Response> {
  const { connectionId } = await context.params;
  return whatsAppRuntimeHandler(request, { connectionId });
}

export const runtime = "nodejs";
export const DELETE = handle;
export const GET = handle;
export const HEAD = handle;
export const OPTIONS = handle;
export const PATCH = handle;
export const POST = handle;
export const PUT = handle;
