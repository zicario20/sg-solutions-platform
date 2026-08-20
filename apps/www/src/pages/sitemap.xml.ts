import type { APIRoute } from "astro";
import { PUBLIC_PAGES } from "../content/site-content";

export const prerender = true;

export const GET: APIRoute = () => {
  const urls = PUBLIC_PAGES.filter((page) => page.publicationState === "published")
    .map(
      (page) =>
        `<url><loc>${escapeXml(new URL(page.path, "https://www.sgsllc.com").toString())}</loc></url>`,
    )
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    },
  );
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
