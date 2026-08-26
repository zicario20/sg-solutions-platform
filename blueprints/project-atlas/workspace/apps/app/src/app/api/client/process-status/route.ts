import { getConfiguredProcessStatusRuntime } from "../../../../lib/process-status/configured-runtime.ts";
import { handleProcessLandingGet } from "../../../../lib/process-status/http.ts";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET(request: Request) {
  return handleProcessLandingGet(request, await getConfiguredProcessStatusRuntime());
}
