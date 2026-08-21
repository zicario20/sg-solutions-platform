import { AuthField, authFormAttributes, AuthShell } from "@atlas/ui";
export default function Page() { return <AuthShell title="Recuperar acceso"><form {...authFormAttributes("recovery")}><AuthField label="Correo electrónico" type="email" autoComplete="email" /><button>Continuar</button></form></AuthShell>; }
