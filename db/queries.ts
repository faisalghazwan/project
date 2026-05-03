import "server-only";
import { desc } from "drizzle-orm";
import { db } from "./index";
import { sessions } from "./schema";

export function listSessions() {
  return db.select().from(sessions).orderBy(desc(sessions.startedAt)).all();
}
