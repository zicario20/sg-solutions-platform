import { PUBLIC_PAGES } from "../content/site-content";
import type { Locale, RouteKey } from "../domain/public-site";

export function getAlternatePath(_routeKey: RouteKey, _locale: Locale): string {
  const match = PUBLIC_PAGES.find((page) => page.routeKey === _routeKey && page.locale === _locale);
  if (!match) {
    throw new Error(`Missing ${_locale} route for ${_routeKey}`);
  }
  return match.path;
}

function normalizePath(pathname: string): string {
  if (pathname === "/") return pathname;
  const withoutQuery = pathname.split(/[?#]/, 1)[0] ?? pathname;
  return `/${withoutQuery.replace(/^\/+|\/+$/g, "")}/`;
}

export function getPageByPath(pathname: string) {
  const normalized = normalizePath(pathname);
  return PUBLIC_PAGES.find((page) => page.path === normalized);
}

export function getStaticPageEntries() {
  return PUBLIC_PAGES.filter((page) => page.path !== "/").map((page) => ({
    params: { slug: page.path.replace(/^\//, "").replace(/\/$/, "") },
    props: { page },
  }));
}
