import type { Express } from "express";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import sectors from "../../../web/src/lib/sector-config.json" with { type: "json" };

// Static artifact rewrites cannot issue HTTP redirects. These public paths
// are routed to the existing API service, without authentication or new services.
export function registerPublicRouting(app: Express) {
  app.get("/menu-digitale", (req, res) => {
    const query = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
    res.redirect(301, `/menu-digitali${query}`);
  });
  app.get("/per", (_req, res) => { res.redirect(302, "/"); });
  app.get("/per/:slug", async (req, res) => {
    const slug = req.params.slug;
    const found = Object.hasOwn(sectors, slug);
    if (process.env.NODE_ENV !== "production") {
      try {
        const upstream = await fetch(`http://127.0.0.1:22333${req.originalUrl}`);
        if (!upstream.ok) throw new Error("Preview unavailable");
        res.status(found ? 200 : 404).set("Cache-Control", "no-store").type("html").send(await upstream.text());
      } catch {
        req.log.error("Anteprima della landing settoriale non disponibile");
        res.status(503).send("Anteprima temporaneamente non disponibile.");
      }
      return;
    }
    const publicDir = fileURLToPath(new URL("../../../web/dist/public/", import.meta.url));
    // In the production bundle import.meta.url belongs to api-server/dist/index.mjs.
    const bundleDir = fileURLToPath(new URL("../../web/dist/public/", import.meta.url));
    const dir = import.meta.url.includes("/src/lib/") ? publicDir : bundleDir;
    res.status(found ? 200 : 404).sendFile(found ? resolve(dir, "per", slug, "index.html") : resolve(dir, "404.html"));
  });
}
