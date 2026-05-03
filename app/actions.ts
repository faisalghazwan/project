"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, max } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { sessionExercises, sessions, sets } from "@/db/schema";

export async function startSession() {
  const [row] = db
    .insert(sessions)
    .values({ startedAt: new Date() })
    .returning({ id: sessions.id })
    .all();

  revalidatePath("/");
  redirect(`/sessions/${row.id}`);
}

const addExerciseSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
  exerciseId: z.coerce.number().int().positive(),
});

export async function addExercise(formData: FormData) {
  const { sessionId, exerciseId } = addExerciseSchema.parse({
    sessionId: formData.get("sessionId"),
    exerciseId: formData.get("exerciseId"),
  });

  const [{ next }] = db
    .select({ next: max(sessionExercises.position) })
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId))
    .all();

  db.insert(sessionExercises)
    .values({
      sessionId,
      exerciseId,
      position: (next ?? 0) + 1,
    })
    .run();

  revalidatePath(`/sessions/${sessionId}`);
}

const addSetSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
  sessionExerciseId: z.coerce.number().int().positive(),
  weight: z.coerce.number().min(0),
  reps: z.coerce.number().int().min(1),
  rpe: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().min(1).max(10).optional(),
  ),
});

export async function addSet(formData: FormData) {
  const { sessionId, sessionExerciseId, weight, reps, rpe } =
    addSetSchema.parse({
      sessionId: formData.get("sessionId"),
      sessionExerciseId: formData.get("sessionExerciseId"),
      weight: formData.get("weight"),
      reps: formData.get("reps"),
      rpe: formData.get("rpe"),
    });

  const [{ next }] = db
    .select({ next: max(sets.position) })
    .from(sets)
    .where(eq(sets.sessionExerciseId, sessionExerciseId))
    .all();

  db.insert(sets)
    .values({
      sessionExerciseId,
      position: (next ?? 0) + 1,
      weight,
      reps,
      rpe: rpe ?? null,
    })
    .run();

  revalidatePath(`/sessions/${sessionId}`);
}

const deleteSetSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
  setId: z.coerce.number().int().positive(),
});

export async function deleteSet(formData: FormData) {
  const { sessionId, setId } = deleteSetSchema.parse({
    sessionId: formData.get("sessionId"),
    setId: formData.get("setId"),
  });

  db.delete(sets).where(eq(sets.id, setId)).run();

  revalidatePath(`/sessions/${sessionId}`);
}

const finishSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
});

export async function finishSession(formData: FormData) {
  const { sessionId } = finishSchema.parse({
    sessionId: formData.get("sessionId"),
  });

  db.update(sessions)
    .set({ finishedAt: new Date() })
    .where(eq(sessions.id, sessionId))
    .run();

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath("/");
}
