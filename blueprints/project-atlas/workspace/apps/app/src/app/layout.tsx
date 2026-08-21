import "./globals.css";
import { resolveAuthPageLocale } from "@atlas/i18n";
import { cookies } from "next/headers";
import { AUTH_LOCALE_COOKIE, RootDocument } from "../lib/auth/locale.ts";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const store = await cookies();
  const locale = resolveAuthPageLocale(undefined, store.get(AUTH_LOCALE_COOKIE)?.value, process.env.ATLAS_DEFAULT_LOCALE);
  return <RootDocument locale={locale}>{children}</RootDocument>;
}
