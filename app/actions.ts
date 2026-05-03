"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sessions } from "@/db/schema";

export async function startSession() {
  const [row] = db
    .insert(sessions)
    .values({ startedAt: new Date() })
    .returning({ id: sessions.id })
    .all();

  revalidatePath("/");
  redirect(`/sessions/${row.id}`);
}
