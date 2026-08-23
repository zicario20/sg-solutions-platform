import { ClientPortalShell } from "@atlas/ui";
import { requireDashboardPageContext } from "../../../../lib/dashboard/page-context.ts";
import { ConversationClient } from "./conversation-client.tsx";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function Page({ params }: { params: Promise<{ conversationRef: string }> }) {
  const [{ locale }, { conversationRef }] = await Promise.all([
    requireDashboardPageContext(),
    params,
  ]);
  return (
    <ClientPortalShell locale={locale} activeRoute="messages">
      <ConversationClient conversationRef={conversationRef} />
    </ClientPortalShell>
  );
}
