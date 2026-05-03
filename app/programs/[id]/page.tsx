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
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/programs"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← programs
      </Link>

      <header className="mt-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{program.name}</h1>
        <ConfirmButton
          action={deleteProgram}
          confirmMessage="delete this program?"
          inputs={[{ name: "programId", value: String(programId) }]}
          label="delete"
        />
      </header>

      <section className="mt-8 space-y-8">
        {days.map((day) => {
          const usedIds = new Set(day.exercises.map((e) => e.exercise.id));
          const remaining = allExercises.filter((e) => !usedIds.has(e.id));

          return (
            <article key={day.id}>
              <div className="flex items-baseline justify-between">
                <h2 className="text-base font-medium">{day.name}</h2>
                <div className="flex items-center gap-3">
                  <form action={startSessionFromProgramDay}>
                    <input type="hidden" name="dayId" value={day.id} />
                    <button
                      type="submit"
                      className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
                    >
                      start
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
                      className="text-xs text-zinc-400 hover:text-red-600"
                    >
                      remove
                    </button>
                  </form>
                </div>
              </div>

              {day.exercises.length > 0 && (
                <ol className="mt-2 space-y-1 text-sm">
                  {day.exercises.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-3 tabular-nums"
                    >
                      <span className="w-6 text-zinc-500">
                        {e.position}.
                      </span>
                      <span>{e.exercise.name}</span>
                      {(e.targetSets || e.targetReps) && (
                        <span className="text-zinc-500">
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
                        <input
                          type="hidden"
                          name="pdeId"
                          value={e.id}
                        />
                        <button
                          type="submit"
                          className="text-xs text-zinc-400 hover:text-red-600"
                          aria-label="remove exercise"
                        >
                          ×
                        </button>
                      </form>
                    </li>
                  ))}
                </ol>
              )}

              {remaining.length > 0 && (
                <form
                  action={addDayExercise}
                  className="mt-3 flex flex-wrap items-center gap-2 text-sm"
                >
                  <input
                    type="hidden"
                    name="programId"
                    value={programId}
                  />
                  <input type="hidden" name="dayId" value={day.id} />
                  <select
                    name="exerciseId"
                    required
                    defaultValue=""
                    className="flex-1 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
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
                    min="1"
                    max="20"
                    placeholder="sets"
                    className="w-16 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <span className="text-zinc-500">×</span>
                  <input
                    name="targetReps"
                    type="number"
                    min="1"
                    max="50"
                    placeholder="reps"
                    className="w-16 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <button
                    type="submit"
                    className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
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
        className="mt-10 flex items-center gap-2 border-t border-zinc-200 pt-6 text-sm dark:border-zinc-800"
      >
        <input type="hidden" name="programId" value={programId} />
        <input
          name="name"
          required
          maxLength={40}
          placeholder="day name (e.g. push, pull, legs)"
          className="flex-1 rounded border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          add day
        </button>
      </form>
    </main>
  );
}
