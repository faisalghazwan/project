import { listExercises } from "@/db/queries";
import { ExerciseList } from "./list";

export const dynamic = "force-dynamic";

export default function ExercisesPage() {
  const all = listExercises();

  return (
    <main className="mx-auto max-w-2xl px-4 pt-8 pb-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">exercises</h1>
        <span className="text-xs text-zinc-500 tabular-nums">
          {all.length} total
        </span>
      </header>

      <ExerciseList exercises={all} />
    </main>
  );
}
