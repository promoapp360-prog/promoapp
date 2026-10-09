import type { Request, RequestHandler } from "express";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE = "promoapp_admin";
const TTL = 8 * 60 * 60;
const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};
const signature = (payload: string, password: string, key: string) =>
  createHmac("sha256", key).update(password).update("\0").update(payload).digest("hex");

function session(req: Pick<Request, "get">, password?: string, key?: string) {
  if (!password?.trim() || !key) return undefined;
  const cookie = req.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!cookie || !/^\d{10,13}\.[a-f0-9]{48}\.[a-f0-9]{64}$/.test(cookie)) return undefined;
  const [expiry, nonce, mac] = cookie.split(".");
  if (Number(expiry) <= Math.floor(Date.now() / 1000) || Number(expiry) > Math.floor(Date.now() / 1000) + TTL) return undefined;
  return safeEqual(mac, signature(`${expiry}.${nonce}`, password.trim(), key)) ? nonce : undefined;
}

export function createAdminAuthorization(
  credential = () => process.env.ADMIN_PASSWORD,
  signingKey = () => process.env.SESSION_SECRET,
): RequestHandler {
  const failures = new Map<string, { count: number; expires: number }>();
  return (req, res, next) => {
    const path = req.path.toLowerCase();
    const protectedRoute = path === "/admin" || path.startsWith("/admin/");
    if (!protectedRoute) { next(); return; }
    res.setHeader("Cache-Control", "no-store");
    const origin = req.get("origin");
    if (origin) {
      try {
        if (![req.hostname, "promoapp.it", "www.promoapp.it", ...(process.env.REPLIT_DOMAINS ?? "").split(",")].includes(new URL(origin).hostname)) {
          res.status(403).json({ message: "Origine non autorizzata." }); return;
        }
      } catch { res.status(403).json({ message: "Origine non valida." }); return; }
    }
    const password = credential()?.trim(), key = signingKey();
    if (!password || !key) {
      res.status(503).json({ message: "Accesso admin non configurato: servono ADMIN_PASSWORD e SESSION_SECRET sul server." });
      return;
    }
    const cookieOptions = { httpOnly: true, secure: req.secure || process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/api" };
    if (path === "/admin/login" && req.method === "POST") {
      if (!req.is("application/json")) { res.status(415).json({ message: "Invia la password tramite JSON." }); return; }
      const now = Date.now();
      for (const [ip, entry] of failures) if (entry.expires <= now) failures.delete(ip);
      const ip = req.ip ?? "unknown", entry = failures.get(ip) ?? { count: 0, expires: now + 600000 };
      if (entry.count >= 10 || failures.size >= 10000) {
        res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.expires - now) / 1000))));
        res.status(429).json({ message: "Troppi tentativi. Attendi 10 minuti." }); return;
      }
      const supplied = typeof req.body?.password === "string" ? req.body.password.trim() : "";
      if (!supplied || !safeEqual(supplied, password)) {
        entry.count++; failures.set(ip, entry);
        req.log?.warn({ event: "admin_login_rejected" }, "Accesso admin rifiutato");
        res.status(401).json({ message: supplied ? "Password non valida per questo server." : "Inserisci la password." }); return;
      }
      failures.delete(ip);
      const nonce = randomBytes(24).toString("hex");
      const payload = `${Math.floor(Date.now() / 1000) + TTL}.${nonce}`;
      res.cookie(COOKIE, `${payload}.${signature(payload, password, key)}`, { ...cookieOptions, maxAge: TTL * 1000 });
      res.json({ authenticated: true, csrfToken: nonce }); return;
    }
    const nonce = session(req, password, key);
    if (!nonce) { res.status(401).json({ message: "Accedi al pannello admin." }); return; }
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !safeEqual(req.get("x-admin-csrf") ?? "", nonce)) {
      res.status(403).json({ message: "Richiesta non autorizzata. Ricarica il pannello." }); return;
    }
    if (path === "/admin/session" && req.method === "GET") { res.json({ authenticated: true, csrfToken: nonce }); return; }
    if (path === "/admin/logout" && req.method === "POST") {
      res.clearCookie(COOKIE, cookieOptions); res.json({ authenticated: false }); return;
    }
    next();
  };
}
export const adminAuthorization = createAdminAuthorization();
