"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, max } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { getProgramDay, getProgramDayExercises } from "@/db/queries";
import {
  programDayExercises,
  programDays,
  programs,
  sessionExercises,
  sessions,
  sets,
} from "@/db/schema";

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

const removeSeSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
  sessionExerciseId: z.coerce.number().int().positive(),
});

export async function removeSessionExercise(formData: FormData) {
  const { sessionId, sessionExerciseId } = removeSeSchema.parse({
    sessionId: formData.get("sessionId"),
    sessionExerciseId: formData.get("sessionExerciseId"),
  });

  db.delete(sessionExercises)
    .where(eq(sessionExercises.id, sessionExerciseId))
    .run();

  revalidatePath(`/sessions/${sessionId}`);
}

const deleteSessionSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
});

export async function deleteSession(formData: FormData) {
  const { sessionId } = deleteSessionSchema.parse({
    sessionId: formData.get("sessionId"),
  });

  db.delete(sessions).where(eq(sessions.id, sessionId)).run();

  revalidatePath("/");
  redirect("/");
}

const notesSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
  notes: z.string().max(2000),
});

export async function updateNotes(formData: FormData) {
  const { sessionId, notes } = notesSchema.parse({
    sessionId: formData.get("sessionId"),
    notes: formData.get("notes") ?? "",
  });

  const trimmed = notes.trim();
  db.update(sessions)
    .set({ notes: trimmed === "" ? null : trimmed })
    .where(eq(sessions.id, sessionId))
    .run();

  revalidatePath(`/sessions/${sessionId}`);
}

const createProgramSchema = z.object({
  name: z.string().min(1).max(60),
});

export async function createProgram(formData: FormData) {
  const { name } = createProgramSchema.parse({
    name: formData.get("name"),
  });

  const [row] = db
    .insert(programs)
    .values({ name: name.trim(), createdAt: new Date() })
    .returning({ id: programs.id })
    .all();

  revalidatePath("/programs");
  redirect(`/programs/${row.id}`);
}

const deleteProgramSchema = z.object({
  programId: z.coerce.number().int().positive(),
});

export async function deleteProgram(formData: FormData) {
  const { programId } = deleteProgramSchema.parse({
    programId: formData.get("programId"),
  });

  db.delete(programs).where(eq(programs.id, programId)).run();
  revalidatePath("/programs");
  redirect("/programs");
}

const addDaySchema = z.object({
  programId: z.coerce.number().int().positive(),
  name: z.string().min(1).max(40),
});

export async function addProgramDay(formData: FormData) {
  const { programId, name } = addDaySchema.parse({
    programId: formData.get("programId"),
    name: formData.get("name"),
  });

  const [{ next }] = db
    .select({ next: max(programDays.position) })
    .from(programDays)
    .where(eq(programDays.programId, programId))
    .all();

  db.insert(programDays)
    .values({
      programId,
      name: name.trim(),
      position: (next ?? 0) + 1,
    })
    .run();

  revalidatePath(`/programs/${programId}`);
}

const removeDaySchema = z.object({
  programId: z.coerce.number().int().positive(),
  dayId: z.coerce.number().int().positive(),
});

export async function removeProgramDay(formData: FormData) {
  const { programId, dayId } = removeDaySchema.parse({
    programId: formData.get("programId"),
    dayId: formData.get("dayId"),
  });

  db.delete(programDays).where(eq(programDays.id, dayId)).run();
  revalidatePath(`/programs/${programId}`);
}

const addDayExerciseSchema = z.object({
  programId: z.coerce.number().int().positive(),
  dayId: z.coerce.number().int().positive(),
  exerciseId: z.coerce.number().int().positive(),
  targetSets: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(1).max(20).optional(),
  ),
  targetReps: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(1).max(50).optional(),
  ),
});

export async function addDayExercise(formData: FormData) {
  const { programId, dayId, exerciseId, targetSets, targetReps } =
    addDayExerciseSchema.parse({
      programId: formData.get("programId"),
      dayId: formData.get("dayId"),
      exerciseId: formData.get("exerciseId"),
      targetSets: formData.get("targetSets"),
      targetReps: formData.get("targetReps"),
    });

  const [{ next }] = db
    .select({ next: max(programDayExercises.position) })
    .from(programDayExercises)
    .where(eq(programDayExercises.programDayId, dayId))
    .all();

  db.insert(programDayExercises)
    .values({
      programDayId: dayId,
      exerciseId,
      position: (next ?? 0) + 1,
      targetSets: targetSets ?? null,
      targetReps: targetReps ?? null,
    })
    .run();

  revalidatePath(`/programs/${programId}`);
}

const removeDayExerciseSchema = z.object({
  programId: z.coerce.number().int().positive(),
  pdeId: z.coerce.number().int().positive(),
});

export async function removeDayExercise(formData: FormData) {
  const { programId, pdeId } = removeDayExerciseSchema.parse({
    programId: formData.get("programId"),
    pdeId: formData.get("pdeId"),
  });

  db.delete(programDayExercises)
    .where(eq(programDayExercises.id, pdeId))
    .run();

  revalidatePath(`/programs/${programId}`);
}

const startFromDaySchema = z.object({
  dayId: z.coerce.number().int().positive(),
});

export async function startSessionFromProgramDay(formData: FormData) {
  const { dayId } = startFromDaySchema.parse({
    dayId: formData.get("dayId"),
  });

  const day = getProgramDay(dayId);
  if (!day) throw new Error("program day not found");

  const dayExercises = getProgramDayExercises(dayId);

  const [session] = db
    .insert(sessions)
    .values({ startedAt: new Date() })
    .returning({ id: sessions.id })
    .all();

  if (dayExercises.length > 0) {
    db.insert(sessionExercises)
      .values(
        dayExercises.map((d) => ({
          sessionId: session.id,
          exerciseId: d.exerciseId,
          position: d.position,
        })),
      )
      .run();
  }

  revalidatePath("/");
  redirect(`/sessions/${session.id}`);
}
