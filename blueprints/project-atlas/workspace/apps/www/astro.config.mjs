import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { PUBLIC_REDIRECTS } from "./public-redirects.mjs";

export default defineConfig({
  adapter: vercel(),
  site: "https://www.sgsllc.com",
  output: "static",
  trailingSlash: "always",
  redirects: PUBLIC_REDIRECTS,
  vite: {
    plugins: [tailwindcss()],
  },
});
