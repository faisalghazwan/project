"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  getExercise,
  getExerciseHistory,
  useReps,
} from "@/lib/store";
import { e1rm } from "@/lib/e1rm";
import { HistoryChart, type ChartPoint } from "./chart";

function fmtDate(t: number) {
  return new Date(t).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function ExerciseDetailWrapper() {
  return (
    <Suspense>
      <ExerciseDetail />
    </Suspense>
  );
}

function ExerciseDetail() {
  const reps = useReps();
  const sp = useSearchParams();
  const id = sp.get("id");

  if (!id) return <NotFound />;

  const exercise = getExercise(reps, id);
  if (!exercise) return <NotFound />;

  const history = getExerciseHistory(reps, id);

  const bySession = new Map<string, { date: number; sets: typeof history }>();
  for (const row of history) {
    const entry = bySession.get(row.sessionId) ?? {
      date: row.startedAt,
      sets: [],
    };
    entry.sets.push(row);
    bySession.set(row.sessionId, entry);
  }
  const grouped = [...bySession.entries()].reverse();

  const best = history.reduce((acc, r) => Math.max(acc, e1rm(r.weight, r.reps)), 0);
  const heaviest = history.reduce((acc, r) => Math.max(acc, r.weight), 0);
  const totalSets = history.length;

  const perSession = new Map<string, ChartPoint>();
  for (const r of history) {
    const point = e1rm(r.weight, r.reps);
    const existing = perSession.get(r.sessionId);
    if (!existing || point > existing.e1rm) {
      perSession.set(r.sessionId, { date: r.startedAt, e1rm: point });
    }
  }
  const chart = [...perSession.values()].sort((a, b) => a.date - b.date);

  const prSessions = new Set<string>();
  let runningBest = 0;
  for (const [sessionId, point] of [...perSession.entries()].sort(
    (a, b) => a[1].date - b[1].date,
  )) {
    if (point.e1rm > runningBest + 1e-6) {
      prSessions.add(sessionId);
      runningBest = point.e1rm;
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pt-5 pb-6">
      <Link
        href="/exercises"
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
        lifts
      </Link>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {exercise.name}
      </h1>
      {exercise.category && (
        <p className="mt-0.5 text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
          {exercise.category}
        </p>
      )}

      {totalSets > 0 ? (
        <>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat label="best e1rm" value={best.toFixed(0)} unit="kg" />
            <Stat label="heaviest" value={String(heaviest)} unit="kg" />
            <Stat label="sets" value={String(totalSets)} unit="" />
          </div>

          {chart.length > 1 && (
            <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
              <HistoryChart data={chart} />
            </div>
          )}

          <section className="mt-6">
            <h2 className="px-1 text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
              history
            </h2>
            <ul className="mt-2 space-y-2">
              {grouped.map(([sessionId, { date, sets }]) => (
                <li
                  key={sessionId}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/session?id=${sessionId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {fmtDate(date)}
                    </Link>
                    {prSessions.has(sessionId) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3"
                        >
                          <path d="m12 2 2.6 5.5 5.9.7-4.4 4.2 1.2 5.9L12 15.5 6.7 18.3l1.2-5.9-4.4-4.2 5.9-.7L12 2z" />
                        </svg>
                        pr
                      </span>
                    )}
                  </div>
                  <ol className="mt-2 space-y-0.5 text-sm nums text-zinc-600 dark:text-zinc-400">
                    {sets.map((s, i) => (
                      <li key={i}>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {s.weight}
                        </span>
                        <span className="px-1 text-zinc-400">×</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {s.reps}
                        </span>
                        {s.rpe != null && (
                          <span className="text-xs"> @ {s.rpe}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-800">
          <p className="text-sm font-medium">no history yet</p>
          <p className="mt-1 text-xs text-zinc-500">
            log this in a session and it&rsquo;ll show up here
          </p>
        </div>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <div className="text-[9.5px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-semibold tracking-tight nums">
          {value}
        </span>
        {unit && <span className="text-xs text-zinc-400">{unit}</span>}
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold">lift not found</h1>
      <Link
        href="/exercises"
        className="mt-4 inline-flex h-10 items-center rounded-lg border border-zinc-200 px-4 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
      >
        all lifts
      </Link>
    </main>
  );
}
