import type { RequestHandler } from "express";
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

export function createAdminAuthorization(credential = () => process.env.ADMIN_PASSWORD): RequestHandler {
  const failures = new Map<string, { count: number; expires: number }>();
  return (req, res, next) => {
  const protectedRoute = req.path === "/admin" || req.path.startsWith("/admin/") ||
    req.path === "/recensioni/pending" ||
    (req.path.startsWith("/recensioni/") && ["PATCH", "DELETE"].includes(req.method));
  if (!protectedRoute) { next(); return; }
  res.setHeader("Cache-Control", "no-store");
  const configured = credential()?.trim();
  if (!configured) { res.status(503).json({ message: "Configura ADMIN_PASSWORD nei segreti per abilitare l'amministrazione." }); return; }
  const now = Date.now();
  for (const [key, entry] of failures) if (entry.expires < now) failures.delete(key);
  const ip = req.ip ?? "unknown";
  const entry = failures.get(ip) ?? { count: 0, expires: now + 600000 };
  if (entry.count >= 10 || failures.size > 10000) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.expires - now) / 1000))));
    res.status(429).json({ message: "Troppi tentativi di accesso. Attendi 10 minuti prima di riprovare." }); return;
  }
  if (!matchesAdminPassword(req.get("x-admin-password"), configured)) {
    entry.count++; failures.set(ip, entry);
    res.status(401).json({ message: "Non autorizzato." }); return;
  }
  failures.delete(ip);
  next();
  };
}
export const adminAuthorization = createAdminAuthorization();
