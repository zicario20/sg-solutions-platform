import { PROJECT_CODE } from "@atlas/config";

if (PROJECT_CODE !== "project-atlas") {
  throw new Error("module_resolution_contract_failed");
}

export { PROJECT_CODE };
