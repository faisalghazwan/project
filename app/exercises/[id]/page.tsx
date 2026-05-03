import Link from "next/link";
import { notFound } from "next/navigation";
import { getExercise, getExerciseHistory } from "@/db/queries";
import { e1rm } from "@/lib/e1rm";

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

      {grouped.length === 0 ? (
        <p className="mt-12 text-sm text-zinc-500">no history yet</p>
      ) : (
        <ul className="mt-8 space-y-6">
          {grouped.map(([sessionId, { date, sets }]) => (
            <li key={sessionId}>
              <Link
                href={`/sessions/${sessionId}`}
                className="text-sm font-medium hover:underline"
              >
                {fmtDate(date)}
              </Link>
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
