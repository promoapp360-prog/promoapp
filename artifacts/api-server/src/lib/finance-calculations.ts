import type { AdminFinanceEntry, AdminFinanceProject } from "@workspace/api-zod";
export function todayRome() { return new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Rome",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()); }
export function verifiedCash(e: AdminFinanceEntry): boolean {
  return Boolean(e.paidAt && !e.details?.cancelled && e.details?.amountConfirmed && e.details.reconciliation === "reconciled");
}
export function confirmedProject(p: AdminFinanceProject): boolean {
  return Boolean(p.details?.agreementConfirmed && p.details.amountKnown && p.details.commercialState==="confirmed");
}
export function projectBalance(p: AdminFinanceProject, entries: AdminFinanceEntry[]) {
  const receivedCents=entries.filter(e=>e.projectId===p.id && e.direction==="income" && e.category!=="monthly_fee" && !e.details?.recurringId && verifiedCash(e)).reduce((s,e)=>s+e.amountCents,0);
  return { receivedCents, outstandingCents: confirmedProject(p) && !p.details?.creditReview
    ? Math.min(Math.max(0,p.totalAmountCents+(p.details?.extraCents??0)-receivedCents),p.details?.confirmedResidualCents??Number.MAX_SAFE_INTEGER) : 0 };
}
export function eligibleIncome(e: AdminFinanceEntry, projects: AdminFinanceProject[]): boolean {
  if(e.direction!=="income" || e.details?.cancelled || !e.details?.amountConfirmed) return false;
  if(e.details?.recurringId) return true; // Only generated from explicitly active agreements.
  const p=projects.find(p=>p.id===e.projectId);
  return Boolean(p && confirmedProject(p) && !p.details?.creditReview && p.outstandingCents>0);
}
