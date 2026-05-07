"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  addExerciseToSession,
  addSet,
  deleteSession,
  deleteSet,
  finishSession,
  getLastSetForExercise,
  getSession,
  getSessionExercises,
  listExercisesSorted,
  removeSessionExercise,
  updateSessionNotes,
  useReps,
  type Exercise,
  type SessionExerciseWithSets,
  type State,
} from "@/lib/store";

function relDate(t: number) {
  const diff = Math.round((Date.now() - t) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.round(diff / 7)}w ago`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function SessionPageWrapper() {
  return (
    <Suspense>
      <SessionPage />
    </Suspense>
  );
}

function SessionPage() {
  const reps = useReps();
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id");

  if (!id) {
    return <NotFound />;
  }

  const session = getSession(reps, id);
  if (!session) {
    return <NotFound />;
  }

  const items = getSessionExercises(reps, id);
  const allExercises = listExercisesSorted(reps);
  const usedIds = new Set(items.map((i) => i.exercise.id));
  const remaining = allExercises.filter((e) => !usedIds.has(e.id));
  const finished = session.finishedAt != null;

  function onFinish() {
    finishSession(id!);
  }

  function onDelete() {
    if (confirm("delete this session?")) {
      deleteSession(id!);
      router.push("/");
    }
  }

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-zinc-200/60 bg-zinc-50/80 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-3 py-3">
          <Link
            href="/"
            aria-label="back"
            className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 active:scale-95 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div className="min-w-0 text-center">
            <div className="truncate text-sm font-medium">
              {new Date(session.startedAt).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider">
              {!finished && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-amber-500 opacity-75" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-amber-500" />
                </span>
              )}
              <span
                className={
                  finished ? "text-zinc-500" : "text-amber-600 dark:text-amber-400"
                }
              >
                {finished ? "finished" : "in progress"}
              </span>
            </div>
          </div>
          <div className="flex w-9 justify-end">
            {!finished && items.length > 0 && (
              <button
                type="button"
                onClick={onFinish}
                className="inline-flex h-9 items-center rounded-md bg-zinc-900 px-3 text-xs font-semibold text-white transition-transform hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                finish
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-3 py-5">
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-800">
            <p className="text-sm font-medium">no lifts yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              add one below to start logging
            </p>
          </div>
        )}

        <section className="space-y-3">
          {items.map((item) => (
            <ExerciseCard
              key={item.id}
              item={item}
              reps={reps}
              sessionId={id}
              finished={finished}
            />
          ))}
        </section>

        {!finished && remaining.length > 0 && (
          <AddExerciseForm sessionId={id} remaining={remaining} />
        )}

        <NotesSection
          sessionId={id}
          notes={session.notes ?? ""}
          finished={finished}
        />

        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-zinc-400 underline-offset-4 hover:text-red-600 hover:underline"
          >
            delete session
          </button>
        </div>
      </main>
    </>
  );
}

function ExerciseCard({
  item,
  reps,
  sessionId,
  finished,
}: {
  item: SessionExerciseWithSets;
  reps: State;
  sessionId: string;
  finished: boolean;
}) {
  const last = getLastSetForExercise(reps, item.exercise.id, sessionId);

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-tight">
            {item.exercise.name}
          </h2>
          {item.exercise.category && (
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
              {item.exercise.category}
            </p>
          )}
        </div>
        {!finished && (
          <button
            type="button"
            onClick={() => {
              if (
                item.sets.length === 0 ||
                confirm(`remove ${item.exercise.name}?`)
              ) {
                removeSessionExercise(item.id);
              }
            }}
            aria-label="remove exercise"
            className="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-600 active:scale-95 dark:hover:bg-zinc-800"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4h8v2" />
              <path d="M6 6l1 14h10l1-14" />
            </svg>
          </button>
        )}
      </div>

      {item.sets.length > 0 && (
        <ol className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
          {item.sets.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 py-2 text-sm nums"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {s.position}
              </span>
              <span className="font-medium">
                {s.weight}
                <span className="px-1 text-zinc-400">×</span>
                {s.reps}
              </span>
              {s.rpe != null && (
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10.5px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  rpe {s.rpe}
                </span>
              )}
              {!finished && (
                <button
                  type="button"
                  onClick={() => deleteSet(s.id)}
                  aria-label="delete set"
                  className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-red-600 active:scale-95 dark:text-zinc-600 dark:hover:bg-zinc-800"
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
              )}
            </li>
          ))}
        </ol>
      )}

      {!finished && (
        <SetForm sessionExerciseId={item.id} last={last} />
      )}
    </article>
  );
}

function SetForm({
  sessionExerciseId,
  last,
}: {
  sessionExerciseId: string;
  last:
    | { weight: number; reps: number; rpe: number | null; startedAt: number }
    | undefined;
}) {
  const [weight, setWeight] = useState("");
  const [rpsInput, setReps] = useState("");
  const [rpe, setRpe] = useState("");

  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const w = parseFloat(weight);
    const r = parseInt(rpsInput, 10);
    const rp = rpe.trim() === "" ? null : parseFloat(rpe);
    if (!Number.isFinite(w) || w < 0) return;
    if (!Number.isInteger(r) || r < 1) return;
    addSet({ sessionExerciseId, weight: w, reps: r, rpe: rp });
    setWeight("");
    setReps("");
    setRpe("");
  }

  function useLast() {
    if (!last) return;
    setWeight(String(last.weight));
    setReps(String(last.reps));
    setRpe(last.rpe != null ? String(last.rpe) : "");
  }

  return (
    <div className="mt-3">
      {last && (
        <button
          type="button"
          onClick={useLast}
          className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10.5px] text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
        >
          <span className="text-[9.5px] uppercase tracking-wider text-zinc-400">
            last
          </span>
          <span className="nums">
            {last.weight}×{last.reps}
            {last.rpe != null && ` @${last.rpe}`}
          </span>
          <span className="text-[9.5px] text-zinc-400">
            · {relDate(last.startedAt)}
          </span>
        </button>
      )}
      <form
        onSubmit={submit}
        className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5"
      >
        <NumField
          value={weight}
          onChange={setWeight}
          placeholder={last ? String(last.weight) : "kg"}
          inputMode="decimal"
          step="0.5"
        />
        <NumField
          value={rpsInput}
          onChange={setReps}
          placeholder={last ? String(last.reps) : "reps"}
          inputMode="numeric"
        />
        <NumField
          value={rpe}
          onChange={setRpe}
          placeholder={last && last.rpe != null ? String(last.rpe) : "rpe"}
          inputMode="decimal"
          step="0.5"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          add
        </button>
      </form>
    </div>
  );
}

function NumField({
  value,
  onChange,
  placeholder,
  inputMode,
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputMode: "decimal" | "numeric";
  step?: string;
}) {
  return (
    <input
      type="text"
      inputMode={inputMode}
      pattern={inputMode === "numeric" ? "[0-9]*" : "[0-9]*[.,]?[0-9]*"}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-11 min-w-0 rounded-lg border border-zinc-200 bg-white px-2 text-center text-base font-medium nums placeholder:font-normal placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
    />
  );
}

function AddExerciseForm({
  sessionId,
  remaining,
}: {
  sessionId: string;
  remaining: Exercise[];
}) {
  const [pick, setPick] = useState("");

  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pick) return;
    addExerciseToSession(sessionId, pick);
    setPick("");
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 flex items-stretch gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white/40 p-2 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <select
        value={pick}
        onChange={(e) => setPick(e.target.value)}
        required
        className="h-11 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <option value="" disabled>
          add a lift…
        </option>
        {remaining.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium transition-colors hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      >
        add
      </button>
    </form>
  );
}

function NotesSection({
  sessionId,
  notes,
  finished,
}: {
  sessionId: string;
  notes: string;
  finished: boolean;
}) {
  const [val, setVal] = useState(notes);
  const [saved, setSaved] = useState(false);

  // re-sync when notes prop changes (e.g. across navigations)
  useEffect(() => {
    setVal(notes);
  }, [notes]);

  function save() {
    updateSessionNotes(sessionId, val);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <section className="mt-8">
      <label
        htmlFor="notes"
        className="px-1 text-[10.5px] font-medium uppercase tracking-wider text-zinc-500"
      >
        notes
      </label>
      <textarea
        id="notes"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        rows={3}
        placeholder={finished ? "" : "how did it feel?"}
        disabled={finished}
        className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
      />
      {!finished && val !== notes && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={save}
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium hover:bg-zinc-50 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            {saved ? "saved" : "save"}
          </button>
        </div>
      )}
    </section>
  );
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold">session not found</h1>
      <Link
        href="/"
        className="mt-4 inline-flex h-10 items-center rounded-lg border border-zinc-200 px-4 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        home
      </Link>
    </main>
  );
}
