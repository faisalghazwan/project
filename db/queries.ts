import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "./index";
import {
  exercises,
  programDayExercises,
  programDays,
  programs,
  sessionExercises,
  sessions,
  sets,
} from "./schema";

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

export type WeekVolume = {
  weekStart: Date; // local Monday
  volume: number;
};

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  // 0=Sun, 1=Mon ... shift so Mon = 0
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

export function getRecentVolume(weeks: number): WeekVolume[] {
  const now = new Date();
  const earliest = startOfWeek(now);
  earliest.setDate(earliest.getDate() - 7 * (weeks - 1));

  const rows = db
    .select({
      startedAt: sessions.startedAt,
      weight: sets.weight,
      reps: sets.reps,
    })
    .from(sets)
    .innerJoin(
      sessionExercises,
      eq(sets.sessionExerciseId, sessionExercises.id),
    )
    .innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
    .all()
    .filter((r) => r.startedAt >= earliest);

  const buckets = new Map<number, number>();
  for (let i = 0; i < weeks; i++) {
    const w = new Date(earliest);
    w.setDate(w.getDate() + i * 7);
    buckets.set(w.getTime(), 0);
  }
  for (const r of rows) {
    const wk = startOfWeek(r.startedAt).getTime();
    buckets.set(wk, (buckets.get(wk) ?? 0) + r.weight * r.reps);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, v]) => ({ weekStart: new Date(t), volume: v }));
}

export type ExerciseSetHistory = {
  sessionId: number;
  startedAt: Date;
  weight: number;
  reps: number;
  rpe: number | null;
};

export function listPrograms() {
  return db.select().from(programs).orderBy(desc(programs.createdAt)).all();
}

export function getProgram(id: number) {
  return db.select().from(programs).where(eq(programs.id, id)).get();
}

export type ProgramDayWithExercises = {
  id: number;
  name: string;
  position: number;
  exercises: Array<{
    id: number;
    position: number;
    targetSets: number | null;
    targetReps: number | null;
    exercise: { id: number; name: string };
  }>;
};

export function getProgramDays(
  programId: number,
): ProgramDayWithExercises[] {
  const days = db
    .select()
    .from(programDays)
    .where(eq(programDays.programId, programId))
    .orderBy(asc(programDays.position))
    .all();

  return days.map((d) => ({
    id: d.id,
    name: d.name,
    position: d.position,
    exercises: db
      .select({
        id: programDayExercises.id,
        position: programDayExercises.position,
        targetSets: programDayExercises.targetSets,
        targetReps: programDayExercises.targetReps,
        exId: exercises.id,
        exName: exercises.name,
      })
      .from(programDayExercises)
      .innerJoin(
        exercises,
        eq(programDayExercises.exerciseId, exercises.id),
      )
      .where(eq(programDayExercises.programDayId, d.id))
      .orderBy(asc(programDayExercises.position))
      .all()
      .map((r) => ({
        id: r.id,
        position: r.position,
        targetSets: r.targetSets,
        targetReps: r.targetReps,
        exercise: { id: r.exId, name: r.exName },
      })),
  }));
}

export function getProgramDay(id: number) {
  return db.select().from(programDays).where(eq(programDays.id, id)).get();
}

export function getProgramDayExercises(programDayId: number) {
  return db
    .select({
      exerciseId: programDayExercises.exerciseId,
      position: programDayExercises.position,
    })
    .from(programDayExercises)
    .where(eq(programDayExercises.programDayId, programDayId))
    .orderBy(asc(programDayExercises.position))
    .all();
}

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
