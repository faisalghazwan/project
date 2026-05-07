"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  addProgramDay,
  addProgramDayExercise,
  deleteProgram,
  getProgram,
  getProgramDays,
  listExercisesSorted,
  removeProgramDay,
  removeProgramDayExercise,
  startSessionFromProgramDay,
  useReps,
  type Exercise,
  type ProgramDayWithExercises,
} from "@/lib/store";

export default function ProgramPageWrapper() {
  return (
    <Suspense>
      <ProgramPage />
    </Suspense>
  );
}

function ProgramPage() {
  const reps = useReps();
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id");

  if (!id) return <NotFound />;

  const program = getProgram(reps, id);
  if (!program) return <NotFound />;

  const days = getProgramDays(reps, id);
  const allExercises = listExercisesSorted(reps);

  function onDelete() {
    if (confirm("delete this plan?")) {
      deleteProgram(id!);
      router.push("/programs");
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pt-5 pb-6">
      <Link
        href="/programs"
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        plans
      </Link>

      <header className="mt-3 flex items-start justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{program.name}</h1>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-9 items-center rounded-md px-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-red-600 active:scale-95 dark:hover:bg-zinc-800"
        >
          delete
        </button>
      </header>

      {days.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-800">
          <p className="text-sm font-medium">no days yet</p>
          <p className="mt-1 text-xs text-zinc-500">
            add a day below (push, pull, legs…)
          </p>
        </div>
      )}

      <section className="mt-6 space-y-3">
        {days.map((day) => (
          <DayCard
            key={day.id}
            day={day}
            allExercises={allExercises}
            onStart={() => {
              const sid = startSessionFromProgramDay(day.id);
              router.push(`/session?id=${sid}`);
            }}
          />
        ))}
      </section>

      <AddDayForm programId={id} />
    </main>
  );
}

function DayCard({
  day,
  allExercises,
  onStart,
}: {
  day: ProgramDayWithExercises;
  allExercises: Exercise[];
  onStart: () => void;
}) {
  const usedIds = new Set(day.exercises.map((e) => e.exercise.id));
  const remaining = allExercises.filter((e) => !usedIds.has(e.id));

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold leading-tight">{day.name}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex h-8 items-center gap-1 rounded-md bg-zinc-900 px-3 text-xs font-semibold text-white transition-transform hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            start
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                day.exercises.length === 0 ||
                confirm(`remove ${day.name}?`)
              ) {
                removeProgramDay(day.id);
              }
            }}
            aria-label="remove day"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-red-600 active:scale-95 dark:hover:bg-zinc-800"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M6 6l1 14h10l1-14" />
            </svg>
          </button>
        </div>
      </div>

      {day.exercises.length > 0 && (
        <ol className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {day.exercises.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 py-2 text-sm nums"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {e.position}
              </span>
              <span className="truncate">{e.exercise.name}</span>
              {(e.targetSets || e.targetReps) && (
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10.5px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {e.targetSets ?? "?"}×{e.targetReps ?? "?"}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeProgramDayExercise(e.id)}
                aria-label="remove exercise"
                className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-100 hover:text-red-600 active:scale-95 dark:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M5 12h14" />
                </svg>
              </button>
            </li>
          ))}
        </ol>
      )}

      {remaining.length > 0 && (
        <AddDayExerciseForm dayId={day.id} remaining={remaining} />
      )}
    </article>
  );
}

function AddDayExerciseForm({
  dayId,
  remaining,
}: {
  dayId: string;
  remaining: Exercise[];
}) {
  const [exId, setExId] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");

  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!exId) return;
    const ts = sets.trim() === "" ? null : parseInt(sets, 10);
    const tr = reps.trim() === "" ? null : parseInt(reps, 10);
    addProgramDayExercise({
      programDayId: dayId,
      exerciseId: exId,
      targetSets: ts != null && Number.isFinite(ts) ? ts : null,
      targetReps: tr != null && Number.isFinite(tr) ? tr : null,
    });
    setExId("");
    setSets("");
    setReps("");
  }

  return (
    <form onSubmit={submit} className="mt-3 grid grid-cols-[1fr_52px_52px_auto] gap-1.5">
      <select
        value={exId}
        onChange={(e) => setExId(e.target.value)}
        required
        className="h-10 min-w-0 rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <option value="" disabled>
          add lift…
        </option>
        {remaining.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      <input
        value={sets}
        onChange={(e) => setSets(e.target.value)}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="sets"
        className="h-10 min-w-0 rounded-lg border border-zinc-200 bg-white px-2 text-center text-sm nums placeholder:font-normal placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
      />
      <input
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="reps"
        className="h-10 min-w-0 rounded-lg border border-zinc-200 bg-white px-2 text-center text-sm nums placeholder:font-normal placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
      />
      <button
        type="submit"
        className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      >
        add
      </button>
    </form>
  );
}

function AddDayForm({ programId }: { programId: string }) {
  const [name, setName] = useState("");

  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    addProgramDay(programId, trimmed);
    setName("");
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 flex items-stretch gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white/40 p-2 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={40}
        placeholder="day name"
        className="h-11 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
      />
      <button
        type="submit"
        className="inline-flex h-11 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      >
        add day
      </button>
    </form>
  );
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold">plan not found</h1>
      <Link
        href="/programs"
        className="mt-4 inline-flex h-10 items-center rounded-lg border border-zinc-200 px-4 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        all plans
      </Link>
    </main>
  );
}
