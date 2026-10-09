import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";

export const sitePageViewsTable = pgTable("site_page_views", {
  id: uuid("id").primaryKey(),
  sessionId: uuid("session_id").notNull(),
  path: varchar("path", { length: 200 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("site_page_views_created_idx").on(table.createdAt)]);
