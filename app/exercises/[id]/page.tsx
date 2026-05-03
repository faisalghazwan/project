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

  // group sets by session for display
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

  // best e1RM per session, ordered by date
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

  // PR sessions: ones whose best e1RM is the running max so far
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
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/exercises"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← exercises
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">{exercise.name}</h1>
      {best > 0 && (
        <p className="mt-1 text-sm text-zinc-500">
          best e1RM: {best.toFixed(1)} kg
        </p>
      )}

      {chart.length > 1 && (
        <div className="mt-6">
          <HistoryChart data={chart} />
        </div>
      )}

      {grouped.length === 0 ? (
        <p className="mt-12 text-sm text-zinc-500">no history yet</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {grouped.map(([sessionId, { date, sets }]) => (
            <li key={sessionId}>
              <div className="flex items-baseline gap-2">
                <Link
                  href={`/sessions/${sessionId}`}
                  className="text-sm font-medium hover:underline"
                >
                  {fmtDate(date)}
                </Link>
                {prSessions.has(sessionId) && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    pr
                  </span>
                )}
              </div>
              <ol className="mt-1 space-y-0.5 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                {sets.map((s, i) => (
                  <li key={i}>
                    {s.weight} × {s.reps}
                    {s.rpe != null && ` @ ${s.rpe}`}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
