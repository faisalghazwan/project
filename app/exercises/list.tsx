"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Exercise = { id: number; name: string; category: string | null };

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
    return [...map.entries()];
  }, [exercises, q]);

  const total = groups.reduce((n, [, list]) => n + list.length, 0);

  return (
    <>
      <div className="relative mt-6">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
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
          placeholder="search exercises"
          className="h-11 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        />
        {q && (
          <button
            type="button"
            aria-label="clear"
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
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
        <p className="mt-10 text-center text-sm text-zinc-500">
          nothing matches “{q}”
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {groups.map(([cat, list]) => (
            <section key={cat}>
              <h2 className="px-1 text-[11px] uppercase tracking-wider text-zinc-500">
                {cat}
              </h2>
              <ul className="mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
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
                      href={`/exercises/${e.id}`}
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-800/60 dark:active:bg-zinc-800"
                    >
                      <span>{e.name}</span>
                      <span className="text-zinc-300 dark:text-zinc-600">→</span>
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
