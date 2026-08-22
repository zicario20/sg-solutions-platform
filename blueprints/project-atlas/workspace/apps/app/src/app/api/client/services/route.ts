import { getConfiguredClientServicesRuntime } from "../../../../lib/client-services/configured-runtime.ts";
import { handleClientServicesListGet } from "../../../../lib/client-services/http.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<Response> {
  return handleClientServicesListGet(request, await getConfiguredClientServicesRuntime());
}
