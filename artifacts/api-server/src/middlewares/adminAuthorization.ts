import type { Request, RequestHandler } from "express";
import { timingSafeEqual } from "node:crypto";

// HTTP header values lose surrounding whitespace during browser transport.
// Normalize the configured secret the same way; never log either value.
export function matchesAdminPassword(candidate: string | undefined, configured = process.env.ADMIN_PASSWORD): boolean {
  const expected = configured?.trim();
  const supplied = candidate?.trim();
  if (!expected || !supplied) return false;
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function readAdminCredential(req: Pick<Request, "path" | "method" | "get" | "body">): string | undefined {
  // A project's own "password" field must never authorize an admin mutation.
  if (req.path === "/admin/verify" && req.method === "POST") {
    return typeof req.body?.password === "string" ? req.body.password : undefined;
  }
  const encoded = req.get("x-admin-credential");
  if (encoded !== undefined) {
    if (!encoded || encoded.length > 8192 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length % 4 !== 0) return undefined;
    const bytes = Buffer.from(encoded, "base64");
    if (bytes.toString("base64") !== encoded) return undefined;
    const decoded = bytes.toString("utf8");
    if (!Buffer.from(decoded, "utf8").equals(bytes)) return undefined;
    return decoded;
  }
  // Retain compatibility with pages opened before this update.
  return req.get("x-admin-password");
}

export function authorizeAdminRequest(req: Pick<Request, "path" | "method" | "get" | "body">): boolean {
  return matchesAdminPassword(readAdminCredential(req));
}

export function createAdminAuthorization(credential = () => process.env.ADMIN_PASSWORD): RequestHandler {
  const failures = new Map<string, { count: number; expires: number }>();
  return (req, res, next) => {
  const protectedRoute = req.path === "/admin" || req.path.startsWith("/admin/") ||
    req.path === "/recensioni/pending" ||
    (req.path.startsWith("/recensioni/") && ["PATCH", "DELETE"].includes(req.method));
  if (!protectedRoute) { next(); return; }
  res.setHeader("Cache-Control", "no-store");
  const configured = credential()?.trim();
  if (!configured) { res.status(503).json({ code: "ADMIN_PASSWORD_MISSING", message: "Configura ADMIN_PASSWORD nei segreti per abilitare l'amministrazione." }); return; }
  const now = Date.now();
  for (const [key, entry] of failures) if (entry.expires < now) failures.delete(key);
  const ip = req.ip ?? "unknown";
  const entry = failures.get(ip) ?? { count: 0, expires: now + 600000 };
  if (entry.count >= 10 || failures.size > 10000) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.expires - now) / 1000))));
    res.status(429).json({ message: "Troppi tentativi di accesso. Attendi 10 minuti prima di riprovare." }); return;
  }
  const supplied = readAdminCredential(req);
  if (!matchesAdminPassword(supplied, configured)) {
    entry.count++; failures.set(ip, entry);
    const code = supplied?.trim() ? "ADMIN_PASSWORD_INVALID" : "ADMIN_CREDENTIAL_MISSING";
    if (req.path === "/admin/verify") {
      req.log?.warn({ event: "admin_login_rejected", code, transport: req.method === "POST" ? "json" : "header" }, "Accesso admin rifiutato");
    }
    res.status(401).json({ code, message: code === "ADMIN_CREDENTIAL_MISSING" ? "Il server non ha ricevuto la password admin." : "La password ricevuta non corrisponde al secret del server." }); return;
  }
  failures.delete(ip);
  next();
  };
}
export const adminAuthorization = createAdminAuthorization();
