import { PROJECT_CODE } from "@atlas/config";
import { createWhatsAppIngressHandler } from "../../apps/app/src/lib/whatsapp/ingress.ts";
import { whatsAppRuntimeHandler } from "../../apps/app/src/lib/whatsapp/runtime.ts";
import {
  GET as whatsappWebhookGet,
  POST as whatsappWebhookPost,
  runtime as whatsappWebhookRuntime,
} from "../../apps/app/src/app/api/integrations/whatsapp/meta/[connectionId]/route.ts";

if (PROJECT_CODE !== "project-atlas") {
  throw new Error("module_resolution_contract_failed");
}

if (
  typeof createWhatsAppIngressHandler !== "function" ||
  typeof whatsAppRuntimeHandler !== "function" ||
  typeof whatsappWebhookGet !== "function" ||
  typeof whatsappWebhookPost !== "function" ||
  whatsappWebhookRuntime !== "nodejs"
) {
  throw new Error("whatsapp_server_module_resolution_contract_failed");
}

export { PROJECT_CODE };
