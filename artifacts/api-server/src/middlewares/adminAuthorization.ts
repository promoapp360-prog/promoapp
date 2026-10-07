import type { RequestHandler } from "express";
import { timingSafeEqual } from "node:crypto";

export function createAdminAuthorization(credential = () => process.env.ADMIN_PASSWORD): RequestHandler {
  const failures = new Map<string, { count: number; expires: number }>();
  return (req, res, next) => {
  const protectedRoute = req.path === "/admin" || req.path.startsWith("/admin/") ||
    (req.path.startsWith("/recensioni/") && ["PATCH", "DELETE"].includes(req.method));
  if (!protectedRoute) { next(); return; }
  res.setHeader("Cache-Control", "no-store");
  const configured = credential();
  if (!configured) { res.status(503).json({ message: "Configura ADMIN_PASSWORD nei segreti per abilitare l'amministrazione." }); return; }
  const now = Date.now();
  for (const [key, entry] of failures) if (entry.expires < now) failures.delete(key);
  const ip = req.ip ?? "unknown";
  const entry = failures.get(ip) ?? { count: 0, expires: now + 600000 };
  if (entry.count >= 10 || failures.size > 10000) { res.status(429).json({ message: "Troppi tentativi di accesso." }); return; }
  const a = Buffer.from(req.get("x-admin-password") ?? ""), b = Buffer.from(configured);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    entry.count++; failures.set(ip, entry);
    res.status(401).json({ message: "Non autorizzato." }); return;
  }
  failures.delete(ip);
  next();
  };
}
export const adminAuthorization = createAdminAuthorization();
