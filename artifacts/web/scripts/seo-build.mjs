import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import pages from "../src/lib/seo-catalog.mjs";
import { seoHtml } from "./seo-html.mjs";

const root = resolve(import.meta.dirname, "..");
const out = resolve(root, "dist/public");
const template = await readFile(resolve(out, "index.html"), "utf8");
// Pre-render real components: unique headings, content and links are readable by
// crawlers and social previews without waiting for browser JavaScript.
const server = await createServer({
  root, configFile: false, plugins: [react()],
  server: { middlewareMode: true }, appType: "custom",
  ssr: { noExternal: ["@workspace/api-client-react"] },
});
try {
  const { default: Home } = await server.ssrLoadModule("/src/pages/Preventivo.tsx");
  const { default: ServiceLanding } = await server.ssrLoadModule("/src/pages/ServiceLanding.tsx");
  const { default: MenuDemo } = await server.ssrLoadModule("/src/pages/MenuDemo.tsx");
  const { default: SectorLanding } = await server.ssrLoadModule("/src/pages/SectorLanding.tsx");
  const { default: ThankYou } = await server.ssrLoadModule("/src/pages/ThankYou.tsx");
  const { default: LeadsAdmin } = await server.ssrLoadModule("/src/pages/LeadsAdmin.tsx");
  for (const path of Object.keys(pages)) {
    const element = path === "/grazie" ? React.createElement(ThankYou)
      : path === "/gestione-contatti" ? React.createElement(LeadsAdmin)
      : path.startsWith("/per/") ? React.createElement(SectorLanding, { slug: path.split("/")[2] })
      : path === "/menu-demo" ? React.createElement(MenuDemo)
      : ["/", "/preventivo"].includes(path) ? React.createElement(Home)
        : React.createElement(ServiceLanding, { service: path.slice(1) });
    const body = renderToString(React.createElement(Router, { ssrPath: path }, element));
    const html = seoHtml(template, path).replace('<div id="root"></div>', `<div id="root">${body}</div>`);
    const file = resolve(out, path === "/" ? "index.html" : `${path.slice(1)}/index.html`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }
  const urls = Object.entries(pages).filter(([, page]) => !page.noindex && !page.canonical)
    .map(([path]) => `<url><loc>https://www.promoapp.it${path === "/" ? "/" : path}</loc></url>`).join("\n");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  await writeFile(resolve(out, "sitemap.xml"), sitemap);
  await writeFile(resolve(root, "public/sitemap.xml"), sitemap);
  console.log(`SEO: ${Object.keys(pages).length} pages pre-rendered with unique metadata; sitemap updated.`);
} finally {
  await server.close();
}
