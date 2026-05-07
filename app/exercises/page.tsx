"use client";

import { listExercisesSorted, useReps } from "@/lib/store";
import { ExerciseList } from "./list";

export default function ExercisesPage() {
  const reps = useReps();
  const all = listExercisesSorted(reps);

  return (
    <main className="mx-auto max-w-2xl px-4 pt-7 pb-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">lifts</h1>
        <span className="text-xs text-zinc-500 nums">{all.length} total</span>
      </header>

      <ExerciseList exercises={all} />
    </main>
  );
}
