import { AuthShell } from "@atlas/ui";
import { currentAuthCopy } from "../../../lib/auth/locale.ts";
export default function Page({ searchParams }: { searchParams: { locale?: string } }) { const copy = currentAuthCopy(searchParams.locale); return <AuthShell title={copy.verify}><form action="/api/auth/verify" method="post"><button type="submit">{copy.verify}</button><p aria-live="polite">{copy.providerDisabled}</p></form></AuthShell>; }
