import Link from "next/link";
import { getRecentVolume, listSessions } from "@/db/queries";
import { startSession } from "./actions";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtVolume(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}t`;
  return `${Math.round(v)}kg`;
}

export default function Home() {
  const all = listSessions();
  const weeks = getRecentVolume(8);
  const max = Math.max(1, ...weeks.map((w) => w.volume));
  const thisWeek = weeks[weeks.length - 1];
  const lastWeek = weeks[weeks.length - 2];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">reps</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/exercises"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            exercises
          </Link>
          <form action={startSession}>
            <button
              type="submit"
              className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
            >
              start session
            </button>
          </form>
        </div>
      </header>

      {thisWeek && thisWeek.volume + (lastWeek?.volume ?? 0) > 0 && (
        <section className="mt-8 rounded border border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs uppercase tracking-wide text-zinc-500">
              this week
            </h2>
            <span className="text-sm tabular-nums">
              {fmtVolume(thisWeek.volume)}
              {lastWeek && lastWeek.volume > 0 && (
                <span className="ml-2 text-xs text-zinc-500">
                  vs {fmtVolume(lastWeek.volume)} last
                </span>
              )}
            </span>
          </div>
          <div className="mt-3 flex h-10 items-end gap-1">
            {weeks.map((w) => (
              <div
                key={w.weekStart.getTime()}
                title={`${w.weekStart.toLocaleDateString()}: ${fmtVolume(w.volume)}`}
                className="flex-1 rounded-sm bg-zinc-200 dark:bg-zinc-800"
                style={{
                  height: `${Math.max(4, (w.volume / max) * 100)}%`,
                }}
              />
            ))}
          </div>
        </section>
      )}

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
