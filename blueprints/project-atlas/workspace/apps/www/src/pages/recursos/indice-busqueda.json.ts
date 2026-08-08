import type { APIRoute } from "astro";
import { HELP_CONTENT } from "../../content/help-center";
import { buildSearchIndex } from "../../lib/help-search";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildSearchIndex(HELP_CONTENT, "es", new Date())), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
