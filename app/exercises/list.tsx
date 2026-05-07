"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Exercise } from "@/lib/store";

export function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? exercises.filter((e) => e.name.toLowerCase().includes(needle))
      : exercises;
    const map = new Map<string, Exercise[]>();
    for (const e of filtered) {
      const cat = e.category ?? "other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(e);
    }
    // sort categories by canonical order if known
    const order = ["push", "pull", "legs", "core", "other"];
    return [...map.entries()].sort(
      (a, b) => order.indexOf(a[0]) - order.indexOf(b[0]),
    );
  }, [exercises, q]);

  const total = groups.reduce((n, [, list]) => n + list.length, 0);

  return (
    <>
      <div className="relative mt-6">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search lifts"
          className="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        />
        {q && (
          <button
            type="button"
            aria-label="clear"
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 active:scale-95 dark:hover:bg-zinc-800"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="h-4 w-4"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      {total === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500">
            no matches for &ldquo;{q}&rdquo;
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {groups.map(([cat, list]) => (
            <section key={cat}>
              <h2 className="px-1 text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
                {cat}
              </h2>
              <ul className="mt-1.5 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
                {list.map((e, i) => (
                  <li
                    key={e.id}
                    className={
                      i > 0
                        ? "border-t border-zinc-100 dark:border-zinc-800"
                        : ""
                    }
                  >
                    <Link
                      href={`/exercise?id=${e.id}`}
                      className="group flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800/60 dark:active:bg-zinc-800"
                    >
                      <span>{e.name}</span>
                      <span className="text-zinc-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
