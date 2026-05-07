"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProgram, listProgramSummaries, useReps } from "@/lib/store";

export default function ProgramsPage() {
  const reps = useReps();
  const all = listProgramSummaries(reps);
  const router = useRouter();
  const [name, setName] = useState("");

  function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = createProgram(trimmed);
    setName("");
    router.push(`/program?id=${id}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pt-7 pb-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">plans</h1>
        <span className="text-xs text-zinc-500 nums">
          {all.length} {all.length === 1 ? "plan" : "plans"}
        </span>
      </header>

      <form onSubmit={submit} className="mt-6 flex items-stretch gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={60}
          placeholder="new plan (push pull legs)"
          className="h-11 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-transform hover:bg-zinc-800 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          create
        </button>
      </form>

      {all.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-800">
          <p className="text-sm font-medium">no plans yet</p>
          <p className="mt-1 text-xs text-zinc-500">
            plans give you a template to start sessions from
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-1.5">
          {all.map((p) => (
            <li key={p.id}>
              <Link
                href={`/program?id=${p.id}`}
                className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3.5 transition-all hover:border-zinc-300 hover:shadow-sm active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:shadow-none"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="mt-0.5 text-xs text-zinc-500 nums">
                    {p.dayCount === 0
                      ? "no days yet"
                      : `${p.dayCount} ${p.dayCount === 1 ? "day" : "days"} · ${p.exerciseCount} ${p.exerciseCount === 1 ? "lift" : "lifts"}`}
                  </div>
                </div>
                <span className="ml-3 text-zinc-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
