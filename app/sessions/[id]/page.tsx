import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSession,
  getSessionExercises,
  listExercises,
} from "@/db/queries";
import {
  addExercise,
  addSet,
  deleteSet,
  finishSession,
} from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessionId = Number(id);
  if (!Number.isInteger(sessionId)) notFound();

  const session = getSession(sessionId);
  if (!session) notFound();

  const items = getSessionExercises(sessionId);
  const allExercises = listExercises();
  const usedIds = new Set(items.map((i) => i.exercise.id));
  const remaining = allExercises.filter((e) => !usedIds.has(e.id));

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← back
      </Link>

      <header className="mt-4 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {session.startedAt.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {session.finishedAt ? "finished" : "in progress"}
          </p>
        </div>
        {!session.finishedAt && items.length > 0 && (
          <form action={finishSession}>
            <input type="hidden" name="sessionId" value={sessionId} />
            <button
              type="submit"
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              finish
            </button>
          </form>
        )}
      </header>

      <section className="mt-8 space-y-8">
        {items.map((item) => (
          <article key={item.id}>
            <h2 className="text-base font-medium">{item.exercise.name}</h2>

            {item.sets.length > 0 && (
              <ol className="mt-2 space-y-1 text-sm">
                {item.sets.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 tabular-nums"
                  >
                    <span className="w-6 text-zinc-500">{s.position}.</span>
                    <span>
                      {s.weight} × {s.reps}
                    </span>
                    {s.rpe != null && (
                      <span className="text-zinc-500">@ {s.rpe}</span>
                    )}
                    {!session.finishedAt && (
                      <form action={deleteSet} className="ml-auto">
                        <input
                          type="hidden"
                          name="sessionId"
                          value={sessionId}
                        />
                        <input type="hidden" name="setId" value={s.id} />
                        <button
                          type="submit"
                          className="text-xs text-zinc-400 hover:text-red-600"
                          aria-label="delete set"
                        >
                          ×
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ol>
            )}

            {!session.finishedAt && (
              <form
                action={addSet}
                className="mt-3 flex flex-wrap items-center gap-2 text-sm"
              >
                <input type="hidden" name="sessionId" value={sessionId} />
                <input
                  type="hidden"
                  name="sessionExerciseId"
                  value={item.id}
                />
                <input
                  name="weight"
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  placeholder="kg"
                  className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <span className="text-zinc-500">×</span>
                <input
                  name="reps"
                  type="number"
                  min="1"
                  required
                  placeholder="reps"
                  className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <input
                  name="rpe"
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  placeholder="rpe"
                  className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <button
                  type="submit"
                  className="rounded bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
                >
                  add
                </button>
              </form>
            )}
          </article>
        ))}
      </section>

      {!session.finishedAt && remaining.length > 0 && (
        <form
          action={addExercise}
          className="mt-10 flex items-center gap-2 border-t border-zinc-200 pt-6 text-sm dark:border-zinc-800"
        >
          <input type="hidden" name="sessionId" value={sessionId} />
          <select
            name="exerciseId"
            required
            defaultValue=""
            className="flex-1 rounded border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="" disabled>
              add exercise…
            </option>
            {remaining.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            add
          </button>
        </form>
      )}
    </main>
  );
}
