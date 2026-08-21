export const VALIDATION_PACKAGE_ID = "@atlas/validation";
export * from "./public-chat.ts";
export * from "./public-forms.ts";
export {
  EMPTY_CHANNEL_COPY_CATALOG,
  parseWhatsAppInboundInput,
  parseWhatsAppText,
  resolveChannelCopy,
} from "./whatsapp.ts";
export type {
  WhatsAppInboundInput,
  WhatsAppLocale,
  WhatsAppMediaMetadata,
} from "./whatsapp.ts";
