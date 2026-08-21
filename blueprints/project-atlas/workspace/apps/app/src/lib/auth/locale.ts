import { authCopy, resolveAuthLocale, resolveAuthPageLocale, type AuthLocale } from "@atlas/i18n";
import { cookies } from "next/headers";
import { createElement, type ReactNode } from "react";

export type AuthPageOutcome = "accepted" | "authenticated" | "denied" | "manual_review" | "unavailable";
export const AUTH_LOCALE_COOKIE = "atlas_locale";

export function currentAuthCopy(locale?: string) {
  return authCopy[resolveAuthLocale(locale ?? process.env.ATLAS_DEFAULT_LOCALE)];
}

export function resolveAuthOutcome(value?: string | null): AuthPageOutcome | undefined {
  return value === "accepted" || value === "authenticated" || value === "denied" || value === "manual_review" || value === "unavailable" ? value : undefined;
}

export async function readAuthPageContext(routeLocale?: string | null, outcome?: string | null) {
  const store = await cookies();
  const locale = resolveAuthPageLocale(routeLocale, store.get(AUTH_LOCALE_COOKIE)?.value, process.env.ATLAS_DEFAULT_LOCALE);
  return { locale, copy: authCopy[locale], csrf: store.get("__Host-atlas_csrf")?.value ?? "", sessionHandle: store.get("__Host-atlas_auth")?.value ?? "", outcome: resolveAuthOutcome(outcome) };
}

export function createAuthLocaleHandler() {
  return async (request: Request): Promise<Response> => {
    const form = await request.formData();
    const locale = resolveAuthPageLocale(String(form.get("locale") ?? ""), undefined, process.env.ATLAS_DEFAULT_LOCALE);
    const requestedReturn = String(form.get("return_to") ?? "");
    const returnTo = /^\/client(?:\/|$)[^\r\n]*$/u.test(requestedReturn) ? requestedReturn : "/client/sign-in";
    const headers = new Headers({ location: new URL(returnTo, request.url).toString(), "cache-control": "private, no-store" });
    headers.append("set-cookie", `${AUTH_LOCALE_COOKIE}=${locale}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=31536000`);
    return new Response(null, { status: 303, headers });
  };
}

export function RootDocument({ locale, children }: { readonly locale: AuthLocale; readonly children: ReactNode }) {
  return createElement("html", { lang: locale }, createElement("body", null, children));
}
