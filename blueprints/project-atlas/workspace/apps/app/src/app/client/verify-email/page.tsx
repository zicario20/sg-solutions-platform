import { AuthShell } from "@atlas/ui";
export default function Page() { return <AuthShell title="Verificar correo"><form action="/api/auth/verify" method="post"><button type="submit">Verificar</button><p aria-live="polite">La entrega está desactivada.</p></form></AuthShell>; }
