import { OAuthOutcomeView } from "@atlas/ui";
import { readAuthPageContext } from "../../../../lib/auth/locale.ts";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; outcome?: string }>;
}) {
  const params = await searchParams;
  const context = await readAuthPageContext(params.locale, params.outcome);
  return (
    <OAuthOutcomeView
      {...context}
      outcome={context.outcome ?? "unavailable"}
      returnTo="/client/oauth/result"
    />
  );
}
