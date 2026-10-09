import { appPath } from "./marketing";
import type { AdminSession } from "@workspace/api-client-react";

let csrfToken = "";
export class AdminApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function clearAdminSession() { csrfToken = ""; }
export async function adminApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(appPath(`/api/admin${path}`), {
    ...options, credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-admin-csrf": csrfToken } : {}), ...options.headers },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new AdminApiError(response.status, result.message ?? "Operazione non riuscita. Riprova.");
  }
  if (response.status === 204) return undefined as T;
  const result = await response.json();
  if ((path === "/login" || path === "/session") && (result as AdminSession).csrfToken) csrfToken = result.csrfToken;
  return result as T;
}
