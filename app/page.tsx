import Link from "next/link";
import { listSessions } from "@/db/queries";
import { startSession } from "./actions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function Home() {
  const all = listSessions();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">reps</h1>
        <form action={startSession}>
          <button
            type="submit"
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
          >
            start session
          </button>
        </form>
      </header>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {all.length === 0 && (
          <li className="py-8 text-center text-sm text-zinc-500">
            no sessions yet
          </li>
        )}
        {all.map((s) => (
          <li key={s.id}>
            <Link
              href={`/sessions/${s.id}`}
              className="block py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">
                  {fmtDate(s.startedAt)}
                </span>
                <span className="text-xs text-zinc-500">
                  {s.finishedAt ? "finished" : "in progress"}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
