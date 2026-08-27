import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { PUBLIC_REDIRECTS } from "./public-redirects.mjs";

const publicSite = new URL(process.env.PUBLIC_SITE_URL ?? "https://www.sgsllc.com");
if (
  publicSite.protocol !== "https:" ||
  publicSite.pathname !== "/" ||
  publicSite.search ||
  publicSite.hash
)
  throw new Error("PUBLIC_SITE_URL must be an HTTPS origin without a path, query, or fragment.");

export default defineConfig({
  adapter: vercel(),
  site: publicSite.origin,
  output: "static",
  trailingSlash: "always",
  redirects: PUBLIC_REDIRECTS,
  vite: {
    plugins: [tailwindcss()],
  },
});
