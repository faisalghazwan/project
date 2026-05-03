import Link from "next/link";
import { notFound } from "next/navigation";
import { getExercise, getExerciseHistory } from "@/db/queries";
import { e1rm } from "@/lib/e1rm";
import { HistoryChart, type ChartPoint } from "./chart";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function ExerciseHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exerciseId = Number(id);
  if (!Number.isInteger(exerciseId)) notFound();

  const exercise = getExercise(exerciseId);
  if (!exercise) notFound();

  const history = getExerciseHistory(exerciseId);

  const bySession = new Map<
    number,
    { date: Date; sets: typeof history }
  >();
  for (const row of history) {
    const entry = bySession.get(row.sessionId) ?? {
      date: row.startedAt,
      sets: [],
    };
    entry.sets.push(row);
    bySession.set(row.sessionId, entry);
  }
  const grouped = [...bySession.entries()].reverse();

  const best = history.reduce(
    (acc, r) => Math.max(acc, e1rm(r.weight, r.reps)),
    0,
  );
  const heaviest = history.reduce((acc, r) => Math.max(acc, r.weight), 0);
  const totalSets = history.length;

  const perSession = new Map<number, ChartPoint>();
  for (const r of history) {
    const point = e1rm(r.weight, r.reps);
    const existing = perSession.get(r.sessionId);
    if (!existing || point > existing.e1rm) {
      perSession.set(r.sessionId, {
        date: r.startedAt.getTime(),
        e1rm: point,
      });
    }
  }
  const chart = [...perSession.values()].sort((a, b) => a.date - b.date);

  const prSessions = new Set<number>();
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
    <main className="mx-auto max-w-2xl px-4 pt-6 pb-6">
      <Link
        href="/exercises"
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        exercises
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        {exercise.name}
      </h1>
      {exercise.category && (
        <p className="mt-0.5 text-xs uppercase tracking-wider text-zinc-500">
          {exercise.category}
        </p>
      )}

      {totalSets > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="best e1rm" value={`${best.toFixed(0)}kg`} />
          <Stat label="heaviest" value={`${heaviest}kg`} />
          <Stat label="total sets" value={`${totalSets}`} />
        </div>
      )}

      {chart.length > 1 && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <HistoryChart data={chart} />
        </div>
      )}

      {grouped.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500">no history yet</p>
          <p className="mt-1 text-xs text-zinc-400">
            log this in a session and it&rsquo;ll show up here
          </p>
        </div>
      ) : (
        <section className="mt-6">
          <h2 className="px-1 text-[11px] uppercase tracking-wider text-zinc-500">
            history
          </h2>
          <ul className="mt-2 space-y-2">
            {grouped.map(([sessionId, { date, sets }]) => (
              <li
                key={sessionId}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/sessions/${sessionId}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {fmtDate(date)}
                  </Link>
                  {prSessions.has(sessionId) && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      pr
                    </span>
                  )}
                </div>
                <ol className="mt-2 space-y-0.5 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                  {sets.map((s, i) => (
                    <li key={i}>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {s.weight}
                      </span>
                      <span className="text-zinc-400"> × </span>
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
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-0.5 text-base font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}
