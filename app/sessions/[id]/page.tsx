import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLastSetForExercise,
  getSession,
  getSessionExercises,
  listExercises,
} from "@/db/queries";
import {
  addExercise,
  addSet,
  deleteSession,
  deleteSet,
  finishSession,
  removeSessionExercise,
  updateNotes,
} from "@/app/actions";
import { ConfirmButton } from "@/app/programs/confirm-button";

export const dynamic = "force-dynamic";

function relDate(d: Date) {
  const diffDays = Math.round(
    (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)}w ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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
  const finished = session.finishedAt != null;

  const lastByExercise = new Map(
    items.map((it) => [
      it.exercise.id,
      getLastSetForExercise(it.exercise.id, sessionId),
    ]),
  );

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/85 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            aria-label="back"
            className="-ml-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
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
              {session.startedAt.toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
              {finished ? "finished" : "in progress"}
            </div>
          </div>
          <div className="flex w-9 justify-end">
            {!finished && items.length > 0 && (
              <form action={finishSession}>
                <input type="hidden" name="sessionId" value={sessionId} />
                <button
                  type="submit"
                  className="inline-flex h-9 items-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  finish
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-500">no exercises yet</p>
            <p className="mt-1 text-xs text-zinc-400">add one below to start logging sets</p>
          </div>
        )}

        <section className="space-y-3">
          {items.map((item) => {
            const last = lastByExercise.get(item.exercise.id);
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-medium leading-tight">
                      {item.exercise.name}
                    </h2>
                    {last && (
                      <p className="mt-0.5 text-xs text-zinc-500 tabular-nums">
                        last: {last.weight} × {last.reps}
                        {last.rpe != null && ` @ ${last.rpe}`}
                        <span className="ml-1.5 text-zinc-400">
                          · {relDate(last.startedAt)}
                        </span>
                      </p>
                    )}
                  </div>
                  {!finished && (
                    <form action={removeSessionExercise}>
                      <input type="hidden" name="sessionId" value={sessionId} />
                      <input
                        type="hidden"
                        name="sessionExerciseId"
                        value={item.id}
                      />
                      <button
                        type="submit"
                        aria-label="remove exercise"
                        className="-mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M6 6l1 14h10l1-14" />
                        </svg>
                      </button>
                    </form>
                  )}
                </div>

                {item.sets.length > 0 && (
                  <ol className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                    {item.sets.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center gap-3 py-2 text-sm tabular-nums"
                      >
                        <span className="w-5 text-xs text-zinc-400">
                          {s.position}
                        </span>
                        <span className="font-medium">
                          {s.weight}
                          <span className="text-zinc-400"> × </span>
                          {s.reps}
                        </span>
                        {s.rpe != null && (
                          <span className="text-xs text-zinc-500">@ {s.rpe}</span>
                        )}
                        {!finished && (
                          <form action={deleteSet} className="ml-auto">
                            <input
                              type="hidden"
                              name="sessionId"
                              value={sessionId}
                            />
                            <input type="hidden" name="setId" value={s.id} />
                            <button
                              type="submit"
                              aria-label="delete set"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-300 hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-600 dark:hover:bg-zinc-800"
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
                          </form>
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                {!finished && (
                  <form
                    action={addSet}
                    className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-2"
                  >
                    <input type="hidden" name="sessionId" value={sessionId} />
                    <input
                      type="hidden"
                      name="sessionExerciseId"
                      value={item.id}
                    />
                    <Field name="weight" placeholder="kg" inputMode="decimal" step="0.5" />
                    <Field name="reps" placeholder="reps" inputMode="numeric" min={1} />
                    <Field
                      name="rpe"
                      placeholder="rpe"
                      inputMode="decimal"
                      step="0.5"
                      min={1}
                      max={10}
                      optional
                    />
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      add
                    </button>
                  </form>
                )}
              </article>
            );
          })}
        </section>

        {!finished && remaining.length > 0 && (
          <form
            action={addExercise}
            className="mt-3 flex items-stretch gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-2 dark:border-zinc-800 dark:bg-zinc-900/60"
          >
            <input type="hidden" name="sessionId" value={sessionId} />
            <select
              name="exerciseId"
              required
              defaultValue=""
              className="h-11 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
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
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              add
            </button>
          </form>
        )}

        <section className="mt-8">
          <form action={updateNotes}>
            <input type="hidden" name="sessionId" value={sessionId} />
            <label
              htmlFor="notes"
              className="px-1 text-[11px] uppercase tracking-wider text-zinc-500"
            >
              notes
            </label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={session.notes ?? ""}
              rows={3}
              placeholder="how did it feel?"
              disabled={finished}
              className="mt-1.5 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
            />
            {!finished && (
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  save
                </button>
              </div>
            )}
          </form>
        </section>

        <div className="mt-10 flex justify-center">
          <ConfirmButton
            action={deleteSession}
            confirmMessage="delete this session?"
            inputs={[{ name: "sessionId", value: String(sessionId) }]}
            label="delete session"
          />
        </div>
      </main>
    </>
  );
}

function Field({
  name,
  placeholder,
  inputMode,
  step,
  min,
  max,
  optional,
}: {
  name: string;
  placeholder: string;
  inputMode: "decimal" | "numeric";
  step?: string;
  min?: number;
  max?: number;
  optional?: boolean;
}) {
  return (
    <input
      name={name}
      type="number"
      inputMode={inputMode}
      step={step}
      min={min}
      max={max}
      required={!optional}
      placeholder={placeholder}
      className="h-11 min-w-0 rounded-lg border border-zinc-200 bg-white px-2 text-center text-base tabular-nums placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
    />
  );
}
