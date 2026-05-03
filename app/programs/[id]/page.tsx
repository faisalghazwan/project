import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProgram,
  getProgramDays,
  listExercises,
} from "@/db/queries";
import {
  addDayExercise,
  addProgramDay,
  deleteProgram,
  removeDayExercise,
  removeProgramDay,
  startSessionFromProgramDay,
} from "@/app/actions";
import { ConfirmButton } from "../confirm-button";

export const dynamic = "force-dynamic";

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const programId = Number(id);
  if (!Number.isInteger(programId)) notFound();

  const program = getProgram(programId);
  if (!program) notFound();

  const days = getProgramDays(programId);
  const allExercises = listExercises();

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 pb-6">
      <Link
        href="/programs"
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
        programs
      </Link>

      <header className="mt-3 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {program.name}
        </h1>
        <ConfirmButton
          action={deleteProgram}
          confirmMessage="delete this program?"
          inputs={[{ name: "programId", value: String(programId) }]}
          label="delete"
          variant="ghost"
        />
      </header>

      {days.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500">no days yet</p>
          <p className="mt-1 text-xs text-zinc-400">add a day below to start building</p>
        </div>
      )}

      <section className="mt-6 space-y-3">
        {days.map((day) => {
          const usedIds = new Set(day.exercises.map((e) => e.exercise.id));
          const remaining = allExercises.filter((e) => !usedIds.has(e.id));

          return (
            <article
              key={day.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-medium leading-tight">
                  {day.name}
                </h2>
                <div className="flex items-center gap-1">
                  <form action={startSessionFromProgramDay}>
                    <input type="hidden" name="dayId" value={day.id} />
                    <button
                      type="submit"
                      className="inline-flex h-8 items-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      start →
                    </button>
                  </form>
                  <form action={removeProgramDay}>
                    <input
                      type="hidden"
                      name="programId"
                      value={programId}
                    />
                    <input type="hidden" name="dayId" value={day.id} />
                    <button
                      type="submit"
                      aria-label="remove day"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
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
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M6 6l1 14h10l1-14" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>

              {day.exercises.length > 0 && (
                <ol className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {day.exercises.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-3 py-2 text-sm tabular-nums"
                    >
                      <span className="w-5 text-xs text-zinc-400">
                        {e.position}
                      </span>
                      <span className="truncate">{e.exercise.name}</span>
                      {(e.targetSets || e.targetReps) && (
                        <span className="text-xs text-zinc-500">
                          {e.targetSets ?? "?"} × {e.targetReps ?? "?"}
                        </span>
                      )}
                      <form
                        action={removeDayExercise}
                        className="ml-auto"
                      >
                        <input
                          type="hidden"
                          name="programId"
                          value={programId}
                        />
                        <input type="hidden" name="pdeId" value={e.id} />
                        <button
                          type="submit"
                          aria-label="remove exercise"
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
                    </li>
                  ))}
                </ol>
              )}

              {remaining.length > 0 && (
                <form
                  action={addDayExercise}
                  className="mt-3 grid grid-cols-[1fr_56px_56px_auto] gap-2"
                >
                  <input type="hidden" name="programId" value={programId} />
                  <input type="hidden" name="dayId" value={day.id} />
                  <select
                    name="exerciseId"
                    required
                    defaultValue=""
                    className="h-10 min-w-0 rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
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
                  <input
                    name="targetSets"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="20"
                    placeholder="sets"
                    className="h-10 rounded-lg border border-zinc-200 bg-white px-2 text-center text-sm tabular-nums placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                  />
                  <input
                    name="targetReps"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="50"
                    placeholder="reps"
                    className="h-10 rounded-lg border border-zinc-200 bg-white px-2 text-center text-sm tabular-nums placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  >
                    add
                  </button>
                </form>
              )}
            </article>
          );
        })}
      </section>

      <form
        action={addProgramDay}
        className="mt-6 flex items-stretch gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-2 dark:border-zinc-800 dark:bg-zinc-900/60"
      >
        <input type="hidden" name="programId" value={programId} />
        <input
          name="name"
          required
          maxLength={40}
          placeholder="day name (push, pull, legs)"
          className="h-11 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          add day
        </button>
      </form>
    </main>
  );
}
