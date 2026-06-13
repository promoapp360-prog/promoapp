import { Router } from "express";
import { db, progettiLavoriTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createProxyMiddleware } from "http-proxy-middleware";
import zlib from "zlib";

const router = Router();

router.use("/proxy/:id", async (req, res, next) => {
  const { id } = req.params;

  try {
    const [progetto] = await db
      .select()
      .from(progettiLavoriTable)
      .where(eq(progettiLavoriTable.id, id))
      .limit(1);

    if (!progetto || !progetto.url) {
      res.status(403).send("Accesso negato");
      return;
    }

    const targetBase = progetto.url.replace(/\/$/, "");
    // Separa origin da subpath (es. https://host.app/admin → origin=https://host.app, subPath=/admin)
    const targetUrlParsed = new URL(targetBase);
    const targetOrigin = targetUrlParsed.origin;
    const targetSubPath =
      targetUrlParsed.pathname === "/" ? "" : targetUrlParsed.pathname.replace(/\/$/, "");

    // Rimuovi header di cache dalla richiesta in arrivo così l'origine risponde sempre 200
    delete req.headers["if-none-match"];
    delete req.headers["if-modified-since"];
    delete req.headers["if-range"];

    const proxy = createProxyMiddleware({
      target: targetOrigin,
      changeOrigin: true,
      selfHandleResponse: true,
      pathRewrite: (path) => {
        const stripped = path.replace(new RegExp(`^/api/proxy/${id}`), "") || "/";
        // Se siamo alla root del proxy E il target ha un subpath, servi quel subpath
        if ((stripped === "/" || stripped === "") && targetSubPath) return targetSubPath;
        return stripped;
      },
      on: {
        proxyRes: (proxyRes, _req, res) => {
          const contentType = proxyRes.headers["content-type"] || "";
          const isHtml = contentType.includes("text/html");
          const encoding = proxyRes.headers["content-encoding"];

          const SKIP = new Set([
            "x-frame-options",
            "content-security-policy",
            "x-content-type-options",
            "etag",
            "last-modified",
            "cache-control",
          ]);
          const headers: Record<string, string | string[]> = {};
          for (const [k, v] of Object.entries(proxyRes.headers)) {
            if (SKIP.has(k)) continue;
            if (isHtml && (k === "content-encoding" || k === "content-length"))
              continue;
            if (v !== undefined) headers[k] = v as string | string[];
          }
          headers["cache-control"] = "no-store";

          // Riscrivi Location header per evitare che il browser esca dal proxy
          const loc = proxyRes.headers["location"];
          if (typeof loc === "string") {
            let newLoc = loc;
            if (loc.startsWith(targetOrigin)) {
              newLoc = `/api/proxy/${id}${loc.slice(targetOrigin.length)}`;
            } else if (loc.startsWith(targetBase)) {
              newLoc = `/api/proxy/${id}${loc.slice(targetBase.length)}`;
            } else if (loc.startsWith("/") && !loc.startsWith("//") && !loc.startsWith(`/api/proxy/${id}`)) {
              newLoc = `/api/proxy/${id}${loc}`;
            }
            headers["location"] = newLoc;
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

            const proxyPrefix = `/api/proxy/${id}`;
            const fixUrlScript = `<script>(function(){var p=${JSON.stringify(
              proxyPrefix,
            )};var sp=${JSON.stringify(targetSubPath || "")};var O=location.origin;function wrap(u){try{if(u==null)return u;if(typeof URL!=='undefined'&&u instanceof URL)u=u.toString();if(typeof u!=='string')return u;if(u.indexOf(p)===0||u.indexOf(p+'/')===0)return u;if(u.charAt(0)==='/'&&u.charAt(1)!=='/')return p+u;if(u.indexOf(O+'/')===0){var rest=u.slice(O.length);if(rest.indexOf(p)===0)return u;return O+p+rest;}return u;}catch(e){return u;}}function strip(u){if(!u)return u;if(u.indexOf(p)===0)return u.slice(p.length)||'/';return u;}function safe(fn){try{fn();}catch(e){console.warn('proxy hook fail',e);}}safe(function(){var loc=window.location;if(loc.pathname.indexOf(p)===0){var stripped=strip(loc.pathname);var initial=(stripped==='/'||stripped==='')?( sp||'/'):stripped;history.replaceState(null,'',initial+loc.search+loc.hash);}});safe(function(){var op=history.pushState.bind(history);history.pushState=function(s,t,u){return op(s,t,wrap(u));};});safe(function(){var orp=history.replaceState.bind(history);history.replaceState=function(s,t,u){return orp(s,t,wrap(u));};});safe(function(){var of=window.fetch;if(!of)return;window.fetch=function(i,init){try{if(typeof i==='string'){i=wrap(i);}else if(i&&typeof Request!=='undefined'&&i instanceof Request){var w=wrap(i.url);if(w!==i.url)i=new Request(w,i);}else if(typeof URL!=='undefined'&&i instanceof URL){i=wrap(i.toString());}}catch(e){}return of.call(this,i,init);};});safe(function(){var ox=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){try{arguments[1]=wrap(u);}catch(e){}return ox.apply(this,arguments);};});['src','href'].forEach(function(prop){['HTMLImageElement','HTMLScriptElement','HTMLLinkElement','HTMLSourceElement','HTMLIFrameElement','HTMLAnchorElement','HTMLMediaElement','HTMLFormElement'].forEach(function(cn){safe(function(){var C=window[cn];if(!C)return;var d=Object.getOwnPropertyDescriptor(C.prototype,prop);if(!d||!d.set)return;Object.defineProperty(C.prototype,prop,{get:d.get,set:function(v){d.set.call(this,wrap(v));},configurable:true});});});});safe(function(){var sa=Element.prototype.setAttribute;Element.prototype.setAttribute=function(n,v){try{var ln=(n||'').toLowerCase();if((ln==='src'||ln==='href'||ln==='action'||ln==='formaction'||ln==='poster'||ln==='data-src')&&typeof v==='string')v=wrap(v);}catch(e){}return sa.call(this,n,v);};});})();</script>`;
            const injectBase = (html: string): string => {
              let out = html.replace(
                /<head([^>]*)>/i,
                `<head$1><base href="${proxyPrefix}/">${fixUrlScript}`
              );
              // Riscrivi percorsi assoluti (src="/x", href="/x", url(/x)) → /api/proxy/{id}/x
              // Evita //... (protocol-relative) e già /api/proxy/...
              out = out.replace(
                /(src|href|action|data-src|poster)="\/(?!\/|api\/proxy\/)/g,
                `$1="${proxyPrefix}/`
              );
              out = out.replace(
                /(src|href|action|data-src|poster)='\/(?!\/|api\/proxy\/)/g,
                `$1='${proxyPrefix}/`
              );
              out = out.replace(
                /url\(\/(?!\/|api\/proxy\/)/g,
                `url(${proxyPrefix}/`
              );
              return out;
            };

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
