import "./globals.css";
import { resolveAuthLocale } from "@atlas/i18n";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = resolveAuthLocale(process.env.ATLAS_DEFAULT_LOCALE);
  return <html lang={locale}><body>{children}</body></html>;
}
