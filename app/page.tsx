"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getRecentVolume,
  getSessionStats,
  listSessionsSorted,
  startSession,
  useReps,
} from "@/lib/store";

function fmtDate(t: number) {
  return new Date(t).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function fmtVolume(v: number): { num: string; unit: string } {
  if (v === 0) return { num: "0", unit: "kg" };
  if (v >= 1000) return { num: (v / 1000).toFixed(1), unit: "t" };
  return { num: `${Math.round(v)}`, unit: "kg" };
}

function delta(curr: number, prev: number) {
  if (prev === 0) return null;
  const pct = Math.round(((curr - prev) / prev) * 100);
  if (pct === 0) return null;
  return pct;
}

export default function HomePage() {
  const reps = useReps();
  const router = useRouter();

  const sessions = listSessionsSorted(reps);
  const weeks = getRecentVolume(reps, 8);
  const max = Math.max(1, ...weeks.map((w) => w.volume));
  const thisWeek = weeks[weeks.length - 1];
  const lastWeek = weeks[weeks.length - 2];
  const deltaPct = thisWeek && lastWeek ? delta(thisWeek.volume, lastWeek.volume) : null;
  const inProgress = sessions.find((s) => !s.finishedAt);

  function start() {
    if (inProgress) {
      router.push(`/session?id=${inProgress.id}`);
      return;
    }
    const id = startSession();
    router.push(`/session?id=${id}`);
  }

  const vol = fmtVolume(thisWeek?.volume ?? 0);
  const lastVol = lastWeek ? fmtVolume(lastWeek.volume) : null;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-2xl px-4 pt-7 pb-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">reps</h1>
        <p
          className="mt-0.5 text-xs text-zinc-500 lowercase"
          suppressHydrationWarning
        >
          {today}
        </p>
      </header>

      {inProgress && (
        <Link
          href={`/session?id=${inProgress.id}`}
          className="mt-5 flex items-center justify-between rounded-2xl bg-zinc-900 px-4 py-4 text-white transition-transform active:scale-[0.99] dark:bg-zinc-50 dark:text-zinc-900"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-amber-400" />
            </span>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider opacity-70">
                live session
              </div>
              <div className="mt-0.5 text-sm font-medium nums">
                {fmtDate(inProgress.startedAt)}
                <span className="opacity-60">
                  {" · "}
                  {(() => {
                    const stats = getSessionStats(reps, inProgress.id);
                    return stats.setCount === 0
                      ? "no sets yet"
                      : `${stats.setCount} ${stats.setCount === 1 ? "set" : "sets"}`;
                  })()}
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs opacity-70">resume →</span>
        </Link>
      )}

      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
        <div className="flex items-center justify-between">
          <h2 className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
            this week
          </h2>
          {deltaPct !== null && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium nums ${
                deltaPct > 0
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {deltaPct > 0 ? "↑" : "↓"} {Math.abs(deltaPct)}%
            </span>
          )}
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight nums">
            {vol.num}
          </span>
          <span className="text-xl font-medium text-zinc-400 nums">
            {vol.unit}
          </span>
          {lastVol && lastWeek!.volume > 0 && (
            <span className="ml-auto text-xs text-zinc-500 nums">
              vs {lastVol.num}{lastVol.unit} prev
            </span>
          )}
        </div>

        <div className="mt-5 flex h-24 items-end gap-1.5">
          {weeks.map((w, i) => {
            const isLast = i === weeks.length - 1;
            const ratio = w.volume / max;
            return (
              <div
                key={w.weekStart}
                className="group relative flex h-full flex-1 flex-col-reverse"
                title={`${new Date(w.weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${fmtVolume(w.volume).num}${fmtVolume(w.volume).unit}`}
              >
                <div
                  className={`w-full rounded-sm transition-colors ${
                    isLast
                      ? "bg-zinc-900 dark:bg-zinc-50"
                      : "bg-zinc-200 group-hover:bg-zinc-300 dark:bg-zinc-800 dark:group-hover:bg-zinc-700"
                  }`}
                  style={{ height: `${Math.max(3, ratio * 100)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-zinc-400 nums">
          <span>
            {weeks[0]
              ? new Date(weeks[0].weekStart).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
          <span>now</span>
        </div>
      </section>

      {!inProgress && sessions.length === 0 && (
        <section className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M6 7v10" />
              <path d="M18 7v10" />
              <path d="M3 9.5v5" />
              <path d="M21 9.5v5" />
              <path d="M6 12h12" />
            </svg>
          </div>
          <p className="mt-4 text-sm font-medium">first session</p>
          <p className="mt-1 max-w-xs text-xs text-zinc-500">
            log sets, track volume, see progress
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-5 inline-flex h-11 items-center rounded-lg bg-zinc-900 px-5 text-sm font-medium text-white hover:bg-zinc-800 active:scale-[0.98] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            start
          </button>
        </section>
      )}

      {sessions.length > 0 && (
        <section className="mt-7">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
              recent
            </h2>
            <span className="text-[10.5px] text-zinc-400 nums">
              {sessions.length} total
            </span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {sessions.map((s) => {
              const stats = getSessionStats(reps, s.id);
              const v = fmtVolume(stats.volume);
              return (
                <li key={s.id}>
                  <Link
                    href={`/session?id=${s.id}`}
                    className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3.5 transition-all hover:border-zinc-300 hover:shadow-sm active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:shadow-none"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {fmtDate(s.startedAt)}
                        </span>
                        {!s.finishedAt && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300">
                            <span className="h-1 w-1 rounded-full bg-amber-500" />
                            live
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-zinc-500 nums">
                        {stats.exerciseCount === 0
                          ? "empty"
                          : `${stats.exerciseCount} ${stats.exerciseCount === 1 ? "lift" : "lifts"} · ${stats.setCount} sets · ${v.num}${v.unit}`}
                      </div>
                    </div>
                    <span className="ml-3 text-zinc-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600">
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
