import { getConfiguredClientServicesRuntime } from "../../../../../lib/client-services/configured-runtime.ts";
import { handleClientServiceDetailGet } from "../../../../../lib/client-services/http.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  context: { params: Promise<{ serviceRef: string }> },
): Promise<Response> {
  const { serviceRef } = await context.params;
  return handleClientServiceDetailGet(
    request,
    serviceRef,
    await getConfiguredClientServicesRuntime(),
  );
}
