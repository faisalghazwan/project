import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "./index";
import { exercises, sessionExercises, sessions, sets } from "./schema";

export function listSessions() {
  return db.select().from(sessions).orderBy(desc(sessions.startedAt)).all();
}

export function getSession(id: number) {
  return db.select().from(sessions).where(eq(sessions.id, id)).get();
}

export function listExercises() {
  return db.select().from(exercises).orderBy(asc(exercises.name)).all();
}

export function getExercise(id: number) {
  return db.select().from(exercises).where(eq(exercises.id, id)).get();
}

export type SessionExerciseWithSets = {
  id: number;
  position: number;
  exercise: { id: number; name: string };
  sets: Array<{
    id: number;
    position: number;
    weight: number;
    reps: number;
    rpe: number | null;
  }>;
};

export function getSessionExercises(
  sessionId: number,
): SessionExerciseWithSets[] {
  const rows = db
    .select({
      seId: sessionExercises.id,
      sePosition: sessionExercises.position,
      exId: exercises.id,
      exName: exercises.name,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(asc(sessionExercises.position))
    .all();

  return rows.map((r) => ({
    id: r.seId,
    position: r.sePosition,
    exercise: { id: r.exId, name: r.exName },
    sets: db
      .select({
        id: sets.id,
        position: sets.position,
        weight: sets.weight,
        reps: sets.reps,
        rpe: sets.rpe,
      })
      .from(sets)
      .where(eq(sets.sessionExerciseId, r.seId))
      .orderBy(asc(sets.position))
      .all(),
  }));
}

export type ExerciseSetHistory = {
  sessionId: number;
  startedAt: Date;
  weight: number;
  reps: number;
  rpe: number | null;
};

export function getExerciseHistory(exerciseId: number): ExerciseSetHistory[] {
  return db
    .select({
      sessionId: sessions.id,
      startedAt: sessions.startedAt,
      weight: sets.weight,
      reps: sets.reps,
      rpe: sets.rpe,
    })
    .from(sets)
    .innerJoin(
      sessionExercises,
      eq(sets.sessionExerciseId, sessionExercises.id),
    )
    .innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
    .where(eq(sessionExercises.exerciseId, exerciseId))
    .orderBy(asc(sessions.startedAt))
    .all();
}
