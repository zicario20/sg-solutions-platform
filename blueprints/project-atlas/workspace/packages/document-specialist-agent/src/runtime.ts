import type { DocumentSpecialistRuntime } from "./contracts.ts";

export function createDocumentSpecialistRuntime(): DocumentSpecialistRuntime {
  return {
    status: "disabled",
    documentDownloadEnabled: false,
    ocrEnabled: false,
    parserEnabled: false,
    classificationExecutionEnabled: false,
    extractionExecutionEnabled: false,
    documentGenerationEnabled: false,
    signatureActionsEnabled: false,
    secureDeliveryEnabled: false,
    aiExecutionEnabled: false,
  };
}
