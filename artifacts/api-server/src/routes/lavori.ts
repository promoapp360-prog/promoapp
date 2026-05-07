import { Router } from "express";
import { randomUUID } from "crypto";

const router = Router();

const PROGETTI: Record<string, { password: string; url: string }> = {
  "dr-oggettistica": {
    password: "ciro",
    url: "https://dr-oggettistica.replit.app",
  },
  "enzo-acconciature": {
    password: "Enzo",
    url: "https://enzoacconciature.replit.app/admin/calendario",
  },
  "nano-caffe": {
    password: "nano",
    url: "https://nanocaffe.replit.app",
  },
};

// Session store (in-memory)
const sessions = new Map<string, { projectId: string; expires: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [token, s] of sessions.entries()) {
    if (s.expires < now) sessions.delete(token);
  }
}, 60 * 60 * 1000);

function getCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const found = cookieHeader.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return found ? found.slice(name.length + 1) : null;
}

function validateToken(token: string, projectId: string): boolean {
  const s = sessions.get(token);
  if (!s || s.projectId !== projectId) return false;
  if (s.expires < Date.now()) { sessions.delete(token); return false; }
  return true;
}

// Controlla se esiste almeno una sessione attiva per il progetto (usata per asset/sub-risorse)
function isProjectUnlocked(projectId: string): boolean {
  const now = Date.now();
  for (const s of sessions.values()) {
    if (s.projectId === projectId && s.expires > now) return true;
  }
  return false;
}

// POST /api/lavori/sblocca
router.post("/lavori/sblocca", (req, res) => {
  const { id, password } = req.body as { id?: string; password?: string };

  if (!id || !password) { res.status(400).json({ success: false }); return; }

  const progetto = PROGETTI[id];
  if (!progetto) { res.status(404).json({ success: false }); return; }

  if (password.trim().toLowerCase() !== progetto.password.toLowerCase()) {
    req.log.info({ id }, "Tentativo accesso lavoro fallito");
    res.status(401).json({ success: false, message: "Password errata" });
    return;
  }

  const token = randomUUID();
  sessions.set(token, { projectId: id, expires: Date.now() + 4 * 60 * 60 * 1000 });
  req.log.info({ id }, "Accesso lavoro sbloccato");
  res.json({ success: true, token });
});

// Reverse proxy — serves all content of the external app
router.use("/proxy/:id", async (req, res) => {
  const { id } = req.params as { id: string };
  const progetto = PROGETTI[id];
  if (!progetto) { res.status(404).end(); return; }

  // Validate session via cookie or query token
  const cookieName = `pp_${id}`;
  const cookieToken = getCookie(req.headers.cookie, cookieName);
  const queryToken = typeof req.query.token === "string" ? req.query.token : undefined;
  const token = cookieToken ?? queryToken;

  // Prima prova con token specifico (cookie o query), poi controlla se il progetto è sbloccato da chiunque
  const tokenValid = token ? validateToken(token, id) : false;
  if (!tokenValid && !isProjectUnlocked(id)) {
    res.status(401).send("Sessione non valida — torna alla home e inserisci la password.");
    return;
  }

  // Set/renew cookie on first valid query token
  if (!cookieToken && queryToken) {
    res.setHeader(
      "Set-Cookie",
      `${cookieName}=${queryToken}; Path=/api/proxy/${id}; HttpOnly; SameSite=Lax; Max-Age=14400`,
    );
  }

  // Build target URL
  const subPath = req.url.replace(/\?.*$/, "").replace(/^\//, "");
  const fwdQuery = { ...req.query };
  delete fwdQuery.token;
  const qs = new URLSearchParams(fwdQuery as Record<string, string>).toString();
  const targetUrl = `${progetto.url}/${subPath}${qs ? `?${qs}` : ""}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        accept: req.headers.accept ?? "*/*",
        "accept-language": req.headers["accept-language"] ?? "it",
        "user-agent": "Mozilla/5.0 (compatible; PromoApp-Proxy/1.0)",
      },
      redirect: "follow",
    });

    // Forward headers — strip iframe-blocking ones
    const SKIP = new Set(["x-frame-options", "content-security-policy", "content-encoding", "transfer-encoding", "connection", "keep-alive"]);
    for (const [key, value] of response.headers.entries()) {
      if (!SKIP.has(key.toLowerCase())) res.setHeader(key, value);
    }
    res.status(response.status);
    // Rimuovi X-Frame-Options aggiunto da Helmet — il proxy deve poter essere embedded
    res.removeHeader("x-frame-options");
    res.removeHeader("content-security-policy");

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("text/html")) {
      let html = await response.text();
      const proxyBase = `/api/proxy/${id}/`;

      // Rewrite absolute paths so assets go through our proxy
      html = html
        .replace(/(src|href|action)="\/(?!\/)/g, `$1="${proxyBase}`)
        .replace(/url\(["']?\/(?!\/)/g, `url("${proxyBase}`);

      // Inject base tag right after <head>
      html = html.replace(/(<head[^>]*>)/i, `$1<base href="${proxyBase}">`);

      res.setHeader("content-type", "text/html; charset=utf-8");
      res.send(html);
    } else {
      const buf = Buffer.from(await response.arrayBuffer());
      res.send(buf);
    }
  } catch (err) {
    req.log.error({ err, targetUrl }, "Proxy error");
    res.status(502).send("Errore di connessione al progetto esterno.");
  }
});

export default router;
