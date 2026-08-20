import { PUBLIC_PAGES } from "../content/site-content";
import type { Locale, RouteKey, Surface } from "../domain/public-site";

export function getAlternatePath(_routeKey: RouteKey, _locale: Locale): string {
  const match = PUBLIC_PAGES.find((page) => page.routeKey === _routeKey && page.locale === _locale);
  if (!match) {
    throw new Error(`Missing ${_locale} route for ${_routeKey}`);
  }
  return match.path;
}

export const getPagesBySurface = (surface: Surface) =>
  PUBLIC_PAGES.filter((page) => page.surface === surface);

function normalizePath(pathname: string): string {
  if (pathname === "/") return pathname;
  const withoutQuery = pathname.split(/[?#]/, 1)[0] ?? pathname;
  return `/${withoutQuery.replace(/^\/+|\/+$/g, "")}/`;
}

export function getPageByPath(pathname: string) {
  const normalized = normalizePath(pathname);
  const legacyClientPath = normalized.startsWith("/portal/")
    ? normalized.replace(/^\/portal\//, "/client/")
    : normalized;
  return PUBLIC_PAGES.find((page) => page.path === normalized || page.path === legacyClientPath);
}

export function getStaticPageEntries() {
  return PUBLIC_PAGES.filter((page) => page.path !== "/").map((page) => ({
    params: { slug: page.path.replace(/^\//, "").replace(/\/$/, "") },
    props: { page },
  }));
}
