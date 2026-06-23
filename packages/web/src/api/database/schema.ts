import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reason: text("reason").notNull(),
  details: text("details"),
  reporterIp: text("reporter_ip"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
