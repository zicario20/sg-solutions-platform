import { RecoveryView } from "@atlas/ui";
import { readAuthPageContext } from "../../../lib/auth/locale.ts";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string; outcome?: string }>;
}) {
  const params = await searchParams;
  return (
    <RecoveryView
      {...(await readAuthPageContext(params.locale, params.outcome))}
      returnTo="/client/recovery"
    />
  );
}
