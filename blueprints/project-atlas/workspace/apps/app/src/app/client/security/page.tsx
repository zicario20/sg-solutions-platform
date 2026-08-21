import { AuthShell, SecurityPanel, SessionList } from "@atlas/ui";
export default function Page() { return <AuthShell title="Seguridad"><SecurityPanel /><SessionList /><form action="/api/auth/sessions" method="post"><button type="submit">Cerrar otras sesiones</button></form></AuthShell>; }
