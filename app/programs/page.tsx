import Link from "next/link";
import { listProgramsWithCounts } from "@/db/queries";
import { createProgram } from "@/app/actions";

export const dynamic = "force-dynamic";

export default function ProgramsPage() {
  const all = listProgramsWithCounts();

  return (
    <main className="mx-auto max-w-2xl px-4 pt-8 pb-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">programs</h1>
        <span className="text-xs text-zinc-500 tabular-nums">
          {all.length} {all.length === 1 ? "program" : "programs"}
        </span>
      </header>

      <form
        action={createProgram}
        className="mt-6 flex items-stretch gap-2"
      >
        <input
          name="name"
          required
          maxLength={60}
          placeholder="new program (e.g. push pull legs)"
          className="h-11 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          create
        </button>
      </form>

      {all.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500">no programs yet</p>
          <p className="mt-1 text-xs text-zinc-400">
            create one above to plan your training
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {all.map((p) => (
            <li key={p.id}>
              <Link
                href={`/programs/${p.id}`}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3.5 transition-colors hover:border-zinc-300 active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:active:bg-zinc-800"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="mt-0.5 text-xs text-zinc-500 tabular-nums">
                    {p.dayCount === 0
                      ? "no days yet"
                      : `${p.dayCount} ${p.dayCount === 1 ? "day" : "days"} · ${p.exerciseCount} ${p.exerciseCount === 1 ? "exercise" : "exercises"}`}
                  </div>
                </div>
                <span className="ml-3 text-zinc-300 dark:text-zinc-600">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
