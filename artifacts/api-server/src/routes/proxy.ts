import { Router } from "express";
import { db, progettiLavoriTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createProxyMiddleware } from "http-proxy-middleware";

const router = Router();

router.use("/proxy/:id", async (req, res, next) => {
  const { id } = req.params;
  const token = (req.query.token as string) || (req.headers["x-preview-token"] as string);

  try {
    const [progetto] = await db
      .select()
      .from(progettiLavoriTable)
      .where(eq(progettiLavoriTable.id, id))
      .limit(1);

    if (!progetto || token !== progetto.id || !progetto.url) {
      res.status(403).send("Accesso negato");
      return;
    }

    const targetBase = progetto.url.replace(/\/$/, "");

    const proxy = createProxyMiddleware({
      target: targetBase,
      changeOrigin: true,
      pathRewrite: (path) => path.replace(new RegExp(`^/api/proxy/${id}`), "") || "/",
      on: {
        proxyRes: (proxyRes) => {
          delete proxyRes.headers["x-frame-options"];
          delete proxyRes.headers["content-security-policy"];
          delete proxyRes.headers["x-content-type-options"];
        },
      },
    });

    proxy(req, res, next);
  } catch (err) {
    res.status(500).send("Errore proxy");
  }
});

export default router;
