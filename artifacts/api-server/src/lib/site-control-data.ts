import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, siteControlRequestsTable, type SiteControlRequest } from "@workspace/db";

export type SiteControlStatus = "Nuova" | "In analisi" | "Report inviato" | "Cliente acquisito";
export type NewSiteControlRequest = {
  siteUrl: string;
  nomeAttivita: string;
  email: string | null;
  whatsapp: string | null;
};

export const siteControlData = {
  async create(input: NewSiteControlRequest): Promise<SiteControlRequest> {
    const [created] = await db.insert(siteControlRequestsTable).values({
      id: randomUUID(),
      ...input,
      authorization: true,
      privacyAccepted: true,
    }).returning();
    return created;
  },
  async list(status?: SiteControlStatus): Promise<SiteControlRequest[]> {
    const query = db.select().from(siteControlRequestsTable).orderBy(desc(siteControlRequestsTable.createdAt));
    return status
      ? query.where(eq(siteControlRequestsTable.status, status))
      : query;
  },
  async updateStatus(id: string, status: SiteControlStatus): Promise<SiteControlRequest | undefined> {
    const [updated] = await db.update(siteControlRequestsTable).set({ status })
      .where(eq(siteControlRequestsTable.id, id)).returning();
    return updated;
  },
  async markNotification(id: string, notification: "sent" | "pending"): Promise<void> {
    await db.update(siteControlRequestsTable).set({ notification })
      .where(eq(siteControlRequestsTable.id, id));
  },
};
