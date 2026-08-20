import {
  createWhatsAppRouteHandler,
  whatsAppRuntimeHandler,
} from "../../../../../../lib/whatsapp/runtime.ts";

const handle = createWhatsAppRouteHandler(whatsAppRuntimeHandler);

export const runtime = "nodejs";
export const DELETE = handle;
export const GET = handle;
export const HEAD = handle;
export const OPTIONS = handle;
export const PATCH = handle;
export const POST = handle;
export const PUT = handle;
