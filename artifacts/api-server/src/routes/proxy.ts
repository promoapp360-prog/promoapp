import { Router } from "express";
import { db, progettiLavoriTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createProxyMiddleware } from "http-proxy-middleware";
import zlib from "zlib";

const router = Router();

router.use("/proxy/:id", async (req, res, next) => {
  const { id } = req.params;
  const token =
    (req.query.token as string) ||
    (req.headers["x-preview-token"] as string);

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
      selfHandleResponse: true,
      pathRewrite: (path) =>
        path.replace(new RegExp(`^/api/proxy/${id}`), "") || "/",
      on: {
        proxyRes: (proxyRes, _req, res) => {
          const contentType = proxyRes.headers["content-type"] || "";
          const isHtml = contentType.includes("text/html");
          const encoding = proxyRes.headers["content-encoding"];

          const headers: Record<string, string | string[]> = {};
          for (const [k, v] of Object.entries(proxyRes.headers)) {
            if (
              k === "x-frame-options" ||
              k === "content-security-policy" ||
              k === "x-content-type-options"
            )
              continue;
            if (isHtml && (k === "content-encoding" || k === "content-length"))
              continue;
            if (v !== undefined) headers[k] = v as string | string[];
          }

          (res as import("express").Response).writeHead(
            proxyRes.statusCode || 200,
            headers
          );

          if (!isHtml) {
            proxyRes.pipe(res as import("http").ServerResponse);
            return;
          }

          const chunks: Buffer[] = [];
          proxyRes.on("data", (chunk: Buffer) => chunks.push(chunk));
          proxyRes.on("end", () => {
            const buffer = Buffer.concat(chunks);

            const injectBase = (html: string): string =>
              html.replace(
                /<head([^>]*)>/i,
                `<head$1><base href="${targetBase}/">`
              );

            const send = (buf: Buffer) => {
              try {
                (res as import("http").ServerResponse).end(
                  injectBase(buf.toString("utf-8"))
                );
              } catch {
                (res as import("http").ServerResponse).end(buf);
              }
            };

            if (encoding === "gzip") {
              zlib.gunzip(buffer, (err, decoded) =>
                err ? (res as import("http").ServerResponse).end(buffer) : send(decoded)
              );
            } else if (encoding === "br") {
              zlib.brotliDecompress(buffer, (err, decoded) =>
                err ? (res as import("http").ServerResponse).end(buffer) : send(decoded)
              );
            } else if (encoding === "deflate") {
              zlib.inflate(buffer, (err, decoded) =>
                err ? (res as import("http").ServerResponse).end(buffer) : send(decoded)
              );
            } else {
              send(buffer);
            }
          });
        },
      },
    });

    proxy(req, res, next);
  } catch {
    res.status(500).send("Errore proxy");
  }
});

export default router;
