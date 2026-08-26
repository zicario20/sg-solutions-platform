import type { ProcessAuthPort } from "@atlas/client-process-status";
import type { DashboardAuthPort } from "@atlas/dashboard";
import { createM007M008ClientServicesAuthAdapter } from "../client-services/auth-adapter.ts";
export function createM007M008M009ProcessAuthAdapter(authPort: DashboardAuthPort): ProcessAuthPort {
  const adapter = createM007M008ClientServicesAuthAdapter(authPort);
  return {
    authorize: ({ request, contextRef }) =>
      adapter.authorize({ request, ...(contextRef ? { contextOpaqueRef: contextRef } : {}) }),
    revalidate: (snapshot) => adapter.revalidate(snapshot),
  };
}
