import Link from "next/link";
import { listPrograms } from "@/db/queries";
import { createProgram } from "@/app/actions";

export const dynamic = "force-dynamic";

export default function ProgramsPage() {
  const all = listPrograms();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← back
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">programs</h1>

      <form
        action={createProgram}
        className="mt-6 flex items-center gap-2 text-sm"
      >
        <input
          name="name"
          required
          maxLength={60}
          placeholder="new program name"
          className="flex-1 rounded border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
        >
          create
        </button>
      </form>

      <ul className="mt-8 divide-y divide-zinc-200 dark:divide-zinc-800">
        {all.length === 0 && (
          <li className="py-8 text-center text-sm text-zinc-500">
            no programs yet
          </li>
        )}
        {all.map((p) => (
          <li key={p.id}>
            <Link
              href={`/programs/${p.id}`}
              className="block py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              {p.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
