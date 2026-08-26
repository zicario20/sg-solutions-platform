import { PROJECT_CODE } from "@atlas/config";
import {
  DELETE as whatsappWebhookDelete,
  GET as whatsappWebhookGet,
  HEAD as whatsappWebhookHead,
  OPTIONS as whatsappWebhookOptions,
  PATCH as whatsappWebhookPatch,
  POST as whatsappWebhookPost,
  PUT as whatsappWebhookPut,
  runtime as whatsappWebhookRuntime,
} from "../../apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts";
import { createWhatsAppIngressHandler } from "../../apps/app/src/lib/whatsapp/ingress.ts";
import { whatsAppRuntimeHandler } from "../../apps/app/src/lib/whatsapp/runtime.ts";

if (PROJECT_CODE !== "project-atlas") {
  throw new Error("module_resolution_contract_failed");
}

if (
  typeof createWhatsAppIngressHandler !== "function" ||
  typeof whatsAppRuntimeHandler !== "function" ||
  typeof whatsappWebhookDelete !== "function" ||
  typeof whatsappWebhookGet !== "function" ||
  typeof whatsappWebhookHead !== "function" ||
  typeof whatsappWebhookOptions !== "function" ||
  typeof whatsappWebhookPatch !== "function" ||
  typeof whatsappWebhookPost !== "function" ||
  typeof whatsappWebhookPut !== "function" ||
  whatsappWebhookRuntime !== "nodejs"
) {
  throw new Error("whatsapp_server_module_resolution_contract_failed");
}

export { PROJECT_CODE };
