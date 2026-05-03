import Link from "next/link";
import { getRecentVolume, listSessionsWithStats } from "@/db/queries";
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
  if (v === 0) return "0";
  return `${Math.round(v)}kg`;
}

function fmtDelta(curr: number, prev: number): { sign: 1 | 0 | -1; pct: number } {
  if (prev === 0) return { sign: 0, pct: 0 };
  const pct = Math.round(((curr - prev) / prev) * 100);
  return { sign: pct === 0 ? 0 : pct > 0 ? 1 : -1, pct: Math.abs(pct) };
}

export default function Home() {
  const sessions = listSessionsWithStats();
  const weeks = getRecentVolume(8);
  const max = Math.max(1, ...weeks.map((w) => w.volume));
  const thisWeek = weeks[weeks.length - 1];
  const lastWeek = weeks[weeks.length - 2];
  const delta = thisWeek && lastWeek ? fmtDelta(thisWeek.volume, lastWeek.volume) : null;

  const inProgress = sessions.find((s) => !s.finishedAt);

  return (
    <main className="mx-auto max-w-2xl px-4 pt-8 pb-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">reps</h1>
        <span className="text-xs text-zinc-500 tabular-nums">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
          })}
        </span>
      </header>

      {inProgress && (
        <Link
          href={`/sessions/${inProgress.id}`}
          className="mt-6 flex items-center justify-between rounded-2xl border border-zinc-900 bg-zinc-900 px-4 py-4 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          <div>
            <div className="text-[11px] uppercase tracking-wider opacity-70">
              in progress
            </div>
            <div className="mt-0.5 text-base font-medium">
              {fmtDate(inProgress.startedAt)} · {inProgress.setCount} sets
            </div>
          </div>
          <span className="text-sm opacity-80">resume →</span>
        </Link>
      )}

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] uppercase tracking-wider text-zinc-500">
            this week
          </h2>
          {delta && delta.sign !== 0 && lastWeek.volume > 0 && (
            <span
              className={`text-xs tabular-nums ${
                delta.sign > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-500"
              }`}
            >
              {delta.sign > 0 ? "↑" : "↓"} {delta.pct}%
            </span>
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums tracking-tight">
            {fmtVolume(thisWeek?.volume ?? 0)}
          </span>
          {lastWeek && lastWeek.volume > 0 && (
            <span className="text-xs text-zinc-500 tabular-nums">
              vs {fmtVolume(lastWeek.volume)} last
            </span>
          )}
        </div>

        <div className="mt-5 flex h-20 items-end gap-1.5">
          {weeks.map((w, i) => {
            const isLast = i === weeks.length - 1;
            return (
              <div
                key={w.weekStart.getTime()}
                className="flex h-full flex-1 flex-col-reverse"
                title={`${w.weekStart.toLocaleDateString()}: ${fmtVolume(w.volume)}`}
              >
                <div
                  className={`w-full rounded-sm ${
                    isLast
                      ? "bg-zinc-900 dark:bg-zinc-50"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                  style={{
                    height: `${Math.max(3, (w.volume / max) * 100)}%`,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] tabular-nums text-zinc-400">
          <span>
            {weeks[0]?.weekStart.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
          <span>now</span>
        </div>
      </section>

      {!inProgress && sessions.length === 0 && (
        <section className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500">no sessions yet</p>
          <form action={startSession} className="mt-5">
            <button
              type="submit"
              className="inline-flex h-11 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              start your first session
            </button>
          </form>
        </section>
      )}

      {sessions.length > 0 && (
        <section className="mt-8">
          <h2 className="px-1 text-[11px] uppercase tracking-wider text-zinc-500">
            recent
          </h2>
          <ul className="mt-2 space-y-2">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3.5 transition-colors hover:border-zinc-300 active:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:active:bg-zinc-800"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {fmtDate(s.startedAt)}
                      </span>
                      {!s.finishedAt && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                          live
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-zinc-500 tabular-nums">
                      {s.exerciseCount === 0
                        ? "empty"
                        : `${s.exerciseCount} ${s.exerciseCount === 1 ? "exercise" : "exercises"} · ${s.setCount} sets · ${fmtVolume(s.volume)}`}
                    </div>
                  </div>
                  <span className="ml-3 text-zinc-300 dark:text-zinc-600">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
