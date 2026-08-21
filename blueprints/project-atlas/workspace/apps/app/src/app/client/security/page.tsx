import { AuthShell, SecurityPanel, SessionList } from "@atlas/ui";
import { currentAuthCopy } from "../../../lib/auth/locale.ts";
export default function Page({ searchParams }: { searchParams: { locale?: string } }) { const copy = currentAuthCopy(searchParams.locale); return <AuthShell title={copy.security}><SecurityPanel /><SessionList /><form action="/api/auth/sessions" method="post"><button type="submit">{copy.closeOtherSessions}</button></form></AuthShell>; }
