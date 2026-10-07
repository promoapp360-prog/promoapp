import type { ContactResponse } from "@workspace/api-client-react";
import type { Service } from "./marketing";
type Receipt = { leadId: string; service: Service; slug: string; at: number; notification: string; viewed?: boolean };
let memory: Receipt | null = null;
export function rememberLead(result: ContactResponse, service: Service, slug = "generale") {
  if (!result.success || !result.leadId) throw new Error("Richiesta non confermata");
  memory = { leadId: result.leadId, service, slug, at: Date.now(), notification: result.notification ?? "pending" };
  try { sessionStorage.setItem("promoapp-receipt", JSON.stringify(memory)); } catch { /* Necessary receipt remains in memory. */ }
}
export function getReceipt(): Receipt | null {
  if (typeof window === "undefined") return null;
  try { memory ??= JSON.parse(sessionStorage.getItem("promoapp-receipt") ?? "null"); } catch { /* No receipt. */ }
  return memory && memory.at > Date.now() - 86400000 ? memory : null;
}
export function markReceiptViewed() {
  const receipt = getReceipt();
  if (!receipt) return;
  receipt.viewed = true;
  try { sessionStorage.setItem("promoapp-receipt", JSON.stringify(receipt)); } catch { /* In-memory marker is sufficient during navigation. */ }
}
