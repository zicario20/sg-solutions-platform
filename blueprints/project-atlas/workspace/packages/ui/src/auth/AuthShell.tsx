import type { ReactNode } from "react";
export function AuthShell({ title, children }: { title: string; children: ReactNode }) { return <main className="auth-shell"><aside><p>SG Solutions</p><h1>{title}</h1><p>Su información permanece protegida.</p></aside><section className="auth-card">{children}</section></main>; }
