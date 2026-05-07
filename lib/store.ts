"use client";

import { useSyncExternalStore } from "react";

export type Exercise = {
  id: string;
  name: string;
  category: string | null;
};

export type Session = {
  id: string;
  startedAt: number;
  finishedAt: number | null;
  notes: string | null;
};

export type SessionExercise = {
  id: string;
  sessionId: string;
  exerciseId: string;
  position: number;
};

export type SetRow = {
  id: string;
  sessionExerciseId: string;
  position: number;
  weight: number;
  reps: number;
  rpe: number | null;
};

export type Program = {
  id: string;
  name: string;
  createdAt: number;
};

export type ProgramDay = {
  id: string;
  programId: string;
  name: string;
  position: number;
};

export type ProgramDayExercise = {
  id: string;
  programDayId: string;
  exerciseId: string;
  position: number;
  targetSets: number | null;
  targetReps: number | null;
};

export type State = {
  exercises: Exercise[];
  sessions: Session[];
  sessionExercises: SessionExercise[];
  sets: SetRow[];
  programs: Program[];
  programDays: ProgramDay[];
  programDayExercises: ProgramDayExercise[];
};

const STORAGE_KEY = "reps:v1";
const SCHEMA_VERSION = 1;

const SEED_EXERCISES: Array<{ name: string; category: string }> = [
  { name: "back squat", category: "legs" },
  { name: "front squat", category: "legs" },
  { name: "deadlift", category: "legs" },
  { name: "romanian deadlift", category: "legs" },
  { name: "leg press", category: "legs" },
  { name: "lunge", category: "legs" },
  { name: "calf raise", category: "legs" },
  { name: "bench press", category: "push" },
  { name: "incline bench press", category: "push" },
  { name: "overhead press", category: "push" },
  { name: "dip", category: "push" },
  { name: "lateral raise", category: "push" },
  { name: "tricep extension", category: "push" },
  { name: "pull up", category: "pull" },
  { name: "chin up", category: "pull" },
  { name: "barbell row", category: "pull" },
  { name: "lat pulldown", category: "pull" },
  { name: "seated row", category: "pull" },
  { name: "face pull", category: "pull" },
  { name: "bicep curl", category: "pull" },
];

const EMPTY: State = Object.freeze({
  exercises: [],
  sessions: [],
  sessionExercises: [],
  sets: [],
  programs: [],
  programDays: [],
  programDayExercises: [],
}) as State;

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function makeSeed(): State {
  return {
    exercises: SEED_EXERCISES.map((e) => ({
      id: uid(),
      name: e.name,
      category: e.category,
    })),
    sessions: [],
    sessionExercises: [],
    sets: [],
    programs: [],
    programDays: [],
    programDayExercises: [],
  };
}

function isClient(): boolean {
  return typeof window !== "undefined";
}

function load(): State {
  if (!isClient()) return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = makeSeed();
      persist(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as { v?: number; state?: State };
    if (parsed.v !== SCHEMA_VERSION || !parsed.state) {
      const seeded = makeSeed();
      persist(seeded);
      return seeded;
    }
    return parsed.state;
  } catch {
    return makeSeed();
  }
}

function persist(s: State) {
  if (!isClient()) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: SCHEMA_VERSION, state: s }),
    );
  } catch {
    // quota / private mode — silently ignore
  }
}

let state: State = isClient() ? load() : EMPTY;
const listeners = new Set<() => void>();

function update(updater: (s: State) => State) {
  state = updater(state);
  persist(state);
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

if (isClient()) {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = load();
    for (const l of listeners) l();
  });
}

export function useReps(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
}

// selectors

export function listSessionsSorted(s: State): Session[] {
  return [...s.sessions].sort((a, b) => b.startedAt - a.startedAt);
}

export function getSession(s: State, id: string): Session | undefined {
  return s.sessions.find((x) => x.id === id);
}

export function listExercisesSorted(s: State): Exercise[] {
  return [...s.exercises].sort((a, b) => a.name.localeCompare(b.name));
}

export function getExercise(s: State, id: string): Exercise | undefined {
  return s.exercises.find((e) => e.id === id);
}

export function listProgramsSorted(s: State): Program[] {
  return [...s.programs].sort((a, b) => b.createdAt - a.createdAt);
}

export function getProgram(s: State, id: string): Program | undefined {
  return s.programs.find((p) => p.id === id);
}

export type SessionExerciseWithSets = {
  id: string;
  position: number;
  exercise: Exercise;
  sets: SetRow[];
};

export function getSessionExercises(
  s: State,
  sessionId: string,
): SessionExerciseWithSets[] {
  const ses = s.sessionExercises
    .filter((se) => se.sessionId === sessionId)
    .sort((a, b) => a.position - b.position);

  return ses
    .map((se) => {
      const ex = s.exercises.find((e) => e.id === se.exerciseId);
      if (!ex) return null;
      const sets = s.sets
        .filter((set) => set.sessionExerciseId === se.id)
        .sort((a, b) => a.position - b.position);
      return {
        id: se.id,
        position: se.position,
        exercise: ex,
        sets,
      };
    })
    .filter((x): x is SessionExerciseWithSets => x !== null);
}

export type SessionStats = {
  exerciseCount: number;
  setCount: number;
  volume: number;
};

export function getSessionStats(s: State, sessionId: string): SessionStats {
  const ses = s.sessionExercises.filter((se) => se.sessionId === sessionId);
  const seIds = new Set(ses.map((se) => se.id));
  const sets = s.sets.filter((set) => seIds.has(set.sessionExerciseId));
  const volume = sets.reduce((acc, x) => acc + x.weight * x.reps, 0);
  return {
    exerciseCount: ses.length,
    setCount: sets.length,
    volume,
  };
}

export type WeekVolume = { weekStart: number; volume: number };

function startOfWeek(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.getTime();
}

export function getRecentVolume(s: State, weeks: number): WeekVolume[] {
  const now = Date.now();
  const earliest = startOfWeek(now) - 7 * 24 * 60 * 60 * 1000 * (weeks - 1);

  const buckets = new Map<number, number>();
  for (let i = 0; i < weeks; i++) {
    buckets.set(earliest + i * 7 * 24 * 60 * 60 * 1000, 0);
  }

  const seBySession = new Map<string, string>(
    s.sessionExercises.map((se) => [se.id, se.sessionId]),
  );
  const sessionStart = new Map<string, number>(
    s.sessions.map((sess) => [sess.id, sess.startedAt]),
  );

  for (const set of s.sets) {
    const sessionId = seBySession.get(set.sessionExerciseId);
    if (!sessionId) continue;
    const t = sessionStart.get(sessionId);
    if (t == null || t < earliest) continue;
    const wk = startOfWeek(t);
    buckets.set(wk, (buckets.get(wk) ?? 0) + set.weight * set.reps);
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekStart, volume]) => ({ weekStart, volume }));
}

export type ExerciseSetHistory = {
  sessionId: string;
  startedAt: number;
  weight: number;
  reps: number;
  rpe: number | null;
};

export function getExerciseHistory(
  s: State,
  exerciseId: string,
): ExerciseSetHistory[] {
  const ses = s.sessionExercises.filter((se) => se.exerciseId === exerciseId);
  const sesMap = new Map(ses.map((se) => [se.id, se]));
  const sessions = new Map(s.sessions.map((x) => [x.id, x]));

  return s.sets
    .filter((set) => sesMap.has(set.sessionExerciseId))
    .map((set) => {
      const se = sesMap.get(set.sessionExerciseId)!;
      const sess = sessions.get(se.sessionId);
      if (!sess) return null;
      return {
        sessionId: sess.id,
        startedAt: sess.startedAt,
        weight: set.weight,
        reps: set.reps,
        rpe: set.rpe,
      };
    })
    .filter((x): x is ExerciseSetHistory => x !== null)
    .sort((a, b) => a.startedAt - b.startedAt);
}

export function getLastSetForExercise(
  s: State,
  exerciseId: string,
  excludeSessionId: string,
): { weight: number; reps: number; rpe: number | null; startedAt: number } | undefined {
  const history = getExerciseHistory(s, exerciseId)
    .filter((h) => h.sessionId !== excludeSessionId)
    .sort((a, b) => b.startedAt - a.startedAt);
  return history[0];
}

export type ProgramDayWithExercises = {
  id: string;
  name: string;
  position: number;
  exercises: Array<{
    id: string;
    position: number;
    targetSets: number | null;
    targetReps: number | null;
    exercise: Exercise;
  }>;
};

export function getProgramDays(
  s: State,
  programId: string,
): ProgramDayWithExercises[] {
  return s.programDays
    .filter((d) => d.programId === programId)
    .sort((a, b) => a.position - b.position)
    .map((d) => ({
      id: d.id,
      name: d.name,
      position: d.position,
      exercises: s.programDayExercises
        .filter((pde) => pde.programDayId === d.id)
        .sort((a, b) => a.position - b.position)
        .map((pde) => {
          const ex = s.exercises.find((e) => e.id === pde.exerciseId);
          return ex
            ? {
                id: pde.id,
                position: pde.position,
                targetSets: pde.targetSets,
                targetReps: pde.targetReps,
                exercise: ex,
              }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    }));
}

export type ProgramSummary = {
  id: string;
  name: string;
  createdAt: number;
  dayCount: number;
  exerciseCount: number;
};

export function listProgramSummaries(s: State): ProgramSummary[] {
  return listProgramsSorted(s).map((p) => {
    const days = s.programDays.filter((d) => d.programId === p.id);
    const dayIds = new Set(days.map((d) => d.id));
    const exCount = s.programDayExercises.filter((pde) =>
      dayIds.has(pde.programDayId),
    ).length;
    return {
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      dayCount: days.length,
      exerciseCount: exCount,
    };
  });
}

// actions

export function startSession(): string {
  const id = uid();
  update((s) => ({
    ...s,
    sessions: [
      ...s.sessions,
      { id, startedAt: Date.now(), finishedAt: null, notes: null },
    ],
  }));
  return id;
}

export function finishSession(sessionId: string) {
  update((s) => ({
    ...s,
    sessions: s.sessions.map((x) =>
      x.id === sessionId ? { ...x, finishedAt: Date.now() } : x,
    ),
  }));
}

export function deleteSession(sessionId: string) {
  update((s) => {
    const seIds = new Set(
      s.sessionExercises.filter((se) => se.sessionId === sessionId).map((se) => se.id),
    );
    return {
      ...s,
      sessions: s.sessions.filter((x) => x.id !== sessionId),
      sessionExercises: s.sessionExercises.filter(
        (se) => se.sessionId !== sessionId,
      ),
      sets: s.sets.filter((set) => !seIds.has(set.sessionExerciseId)),
    };
  });
}

export function updateSessionNotes(sessionId: string, notes: string) {
  const trimmed = notes.trim();
  update((s) => ({
    ...s,
    sessions: s.sessions.map((x) =>
      x.id === sessionId ? { ...x, notes: trimmed === "" ? null : trimmed } : x,
    ),
  }));
}

export function addExerciseToSession(sessionId: string, exerciseId: string) {
  update((s) => {
    const sibs = s.sessionExercises.filter((se) => se.sessionId === sessionId);
    const next = sibs.reduce((m, se) => Math.max(m, se.position), 0) + 1;
    return {
      ...s,
      sessionExercises: [
        ...s.sessionExercises,
        { id: uid(), sessionId, exerciseId, position: next },
      ],
    };
  });
}

export function removeSessionExercise(sessionExerciseId: string) {
  update((s) => ({
    ...s,
    sessionExercises: s.sessionExercises.filter(
      (se) => se.id !== sessionExerciseId,
    ),
    sets: s.sets.filter((set) => set.sessionExerciseId !== sessionExerciseId),
  }));
}

export function addSet(args: {
  sessionExerciseId: string;
  weight: number;
  reps: number;
  rpe: number | null;
}) {
  update((s) => {
    const sibs = s.sets.filter(
      (set) => set.sessionExerciseId === args.sessionExerciseId,
    );
    const next = sibs.reduce((m, set) => Math.max(m, set.position), 0) + 1;
    return {
      ...s,
      sets: [
        ...s.sets,
        {
          id: uid(),
          sessionExerciseId: args.sessionExerciseId,
          position: next,
          weight: args.weight,
          reps: args.reps,
          rpe: args.rpe,
        },
      ],
    };
  });
}

export function deleteSet(setId: string) {
  update((s) => ({
    ...s,
    sets: s.sets.filter((x) => x.id !== setId),
  }));
}

export function createProgram(name: string): string {
  const id = uid();
  update((s) => ({
    ...s,
    programs: [
      ...s.programs,
      { id, name: name.trim(), createdAt: Date.now() },
    ],
  }));
  return id;
}

export function deleteProgram(programId: string) {
  update((s) => {
    const dayIds = new Set(
      s.programDays.filter((d) => d.programId === programId).map((d) => d.id),
    );
    return {
      ...s,
      programs: s.programs.filter((p) => p.id !== programId),
      programDays: s.programDays.filter((d) => d.programId !== programId),
      programDayExercises: s.programDayExercises.filter(
        (pde) => !dayIds.has(pde.programDayId),
      ),
    };
  });
}

export function addProgramDay(programId: string, name: string) {
  update((s) => {
    const sibs = s.programDays.filter((d) => d.programId === programId);
    const next = sibs.reduce((m, d) => Math.max(m, d.position), 0) + 1;
    return {
      ...s,
      programDays: [
        ...s.programDays,
        { id: uid(), programId, name: name.trim(), position: next },
      ],
    };
  });
}

export function removeProgramDay(dayId: string) {
  update((s) => ({
    ...s,
    programDays: s.programDays.filter((d) => d.id !== dayId),
    programDayExercises: s.programDayExercises.filter(
      (pde) => pde.programDayId !== dayId,
    ),
  }));
}

export function addProgramDayExercise(args: {
  programDayId: string;
  exerciseId: string;
  targetSets: number | null;
  targetReps: number | null;
}) {
  update((s) => {
    const sibs = s.programDayExercises.filter(
      (pde) => pde.programDayId === args.programDayId,
    );
    const next = sibs.reduce((m, pde) => Math.max(m, pde.position), 0) + 1;
    return {
      ...s,
      programDayExercises: [
        ...s.programDayExercises,
        {
          id: uid(),
          programDayId: args.programDayId,
          exerciseId: args.exerciseId,
          position: next,
          targetSets: args.targetSets,
          targetReps: args.targetReps,
        },
      ],
    };
  });
}

export function removeProgramDayExercise(pdeId: string) {
  update((s) => ({
    ...s,
    programDayExercises: s.programDayExercises.filter((pde) => pde.id !== pdeId),
  }));
}

export function startSessionFromProgramDay(dayId: string): string {
  const id = uid();
  update((s) => {
    const dayExercises = s.programDayExercises
      .filter((pde) => pde.programDayId === dayId)
      .sort((a, b) => a.position - b.position);
    return {
      ...s,
      sessions: [
        ...s.sessions,
        { id, startedAt: Date.now(), finishedAt: null, notes: null },
      ],
      sessionExercises: [
        ...s.sessionExercises,
        ...dayExercises.map((pde, i) => ({
          id: uid(),
          sessionId: id,
          exerciseId: pde.exerciseId,
          position: i + 1,
        })),
      ],
    };
  });
  return id;
}

export function exportData(): string {
  return JSON.stringify({ v: SCHEMA_VERSION, state }, null, 2);
}

export function importData(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as { v?: number; state?: State };
    if (parsed.v !== SCHEMA_VERSION || !parsed.state) return false;
    update(() => parsed.state!);
    return true;
  } catch {
    return false;
  }
}

export function resetAll() {
  update(() => makeSeed());
}
