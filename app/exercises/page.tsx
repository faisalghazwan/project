import Link from "next/link";
import { listExercises } from "@/db/queries";

export const dynamic = "force-dynamic";

export default function ExercisesPage() {
  const all = listExercises();

  const grouped = new Map<string, typeof all>();
  for (const e of all) {
    const cat = e.category ?? "other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(e);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← back
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">exercises</h1>

      <div className="mt-6 space-y-6">
        {[...grouped.entries()].map(([cat, list]) => (
          <section key={cat}>
            <h2 className="text-xs uppercase tracking-wide text-zinc-500">
              {cat}
            </h2>
            <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
              {list.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/exercises/${e.id}`}
                    className="block py-2 text-sm hover:text-zinc-900 dark:hover:text-white"
                  >
                    {e.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
