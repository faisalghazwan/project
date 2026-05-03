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

export type SessionWithStats = {
  id: number;
  startedAt: Date;
  finishedAt: Date | null;
  exerciseCount: number;
  setCount: number;
  volume: number;
};

export function listSessionsWithStats(): SessionWithStats[] {
  const all = db
    .select()
    .from(sessions)
    .orderBy(desc(sessions.startedAt))
    .all();

  const stats = db
    .select({
      sessionId: sessionExercises.sessionId,
      sessionExerciseId: sessionExercises.id,
      weight: sets.weight,
      reps: sets.reps,
    })
    .from(sessionExercises)
    .leftJoin(sets, eq(sets.sessionExerciseId, sessionExercises.id))
    .all();

  const bySession = new Map<
    number,
    { exercises: Set<number>; setCount: number; volume: number }
  >();
  for (const r of stats) {
    const entry = bySession.get(r.sessionId) ?? {
      exercises: new Set<number>(),
      setCount: 0,
      volume: 0,
    };
    entry.exercises.add(r.sessionExerciseId);
    if (r.weight != null && r.reps != null) {
      entry.setCount++;
      entry.volume += r.weight * r.reps;
    }
    bySession.set(r.sessionId, entry);
  }

  return all.map((s) => {
    const e = bySession.get(s.id);
    return {
      id: s.id,
      startedAt: s.startedAt,
      finishedAt: s.finishedAt,
      exerciseCount: e?.exercises.size ?? 0,
      setCount: e?.setCount ?? 0,
      volume: e?.volume ?? 0,
    };
  });
}

export type LastSetForExercise = {
  weight: number;
  reps: number;
  rpe: number | null;
  startedAt: Date;
};

export function getLastSetForExercise(
  exerciseId: number,
  beforeSessionId: number,
): LastSetForExercise | undefined {
  const row = db
    .select({
      weight: sets.weight,
      reps: sets.reps,
      rpe: sets.rpe,
      startedAt: sessions.startedAt,
      sessionId: sessions.id,
    })
    .from(sets)
    .innerJoin(
      sessionExercises,
      eq(sets.sessionExerciseId, sessionExercises.id),
    )
    .innerJoin(sessions, eq(sessionExercises.sessionId, sessions.id))
    .where(eq(sessionExercises.exerciseId, exerciseId))
    .orderBy(desc(sessions.startedAt), desc(sets.position))
    .all()
    .find((r) => r.sessionId !== beforeSessionId);

  return row
    ? {
        weight: row.weight,
        reps: row.reps,
        rpe: row.rpe,
        startedAt: row.startedAt,
      }
    : undefined;
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

export type ProgramWithCounts = {
  id: number;
  name: string;
  createdAt: Date;
  dayCount: number;
  exerciseCount: number;
};

export function listProgramsWithCounts(): ProgramWithCounts[] {
  const all = db
    .select()
    .from(programs)
    .orderBy(desc(programs.createdAt))
    .all();

  const dayRows = db
    .select({
      programId: programDays.programId,
      dayId: programDays.id,
    })
    .from(programDays)
    .all();

  const exerciseRows = db
    .select({
      dayId: programDayExercises.programDayId,
    })
    .from(programDayExercises)
    .all();

  const exByDay = new Map<number, number>();
  for (const r of exerciseRows) {
    exByDay.set(r.dayId, (exByDay.get(r.dayId) ?? 0) + 1);
  }

  const stats = new Map<number, { days: number; exercises: number }>();
  for (const r of dayRows) {
    const s = stats.get(r.programId) ?? { days: 0, exercises: 0 };
    s.days += 1;
    s.exercises += exByDay.get(r.dayId) ?? 0;
    stats.set(r.programId, s);
  }

  return all.map((p) => ({
    id: p.id,
    name: p.name,
    createdAt: p.createdAt,
    dayCount: stats.get(p.id)?.days ?? 0,
    exerciseCount: stats.get(p.id)?.exercises ?? 0,
  }));
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
