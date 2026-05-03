"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startSession } from "../actions";

const tabs = [
  {
    href: "/",
    label: "log",
    match: (p: string) => p === "/" || p.startsWith("/sessions"),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M3 12 12 4l9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    href: "/exercises",
    label: "exercises",
    match: (p: string) => p.startsWith("/exercises"),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M6 7v10" />
        <path d="M18 7v10" />
        <path d="M3 9v6" />
        <path d="M21 9v6" />
        <path d="M6 12h12" />
      </svg>
    ),
  },
  {
    href: "/programs",
    label: "programs",
    match: (p: string) => p.startsWith("/programs"),
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 9h16" />
        <path d="M9 3v4" />
        <path d="M15 3v4" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="sticky bottom-0 z-40 border-t border-zinc-200 bg-white/85 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-2xl grid-cols-4">
        {tabs.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] tracking-wide transition-colors ${
                active
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </Link>
          );
        })}
        <form action={startSession} className="contents">
          <button
            type="submit"
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] tracking-wide text-zinc-400 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-50"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-4 w-4"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </span>
            <span>start</span>
          </button>
        </form>
      </div>
    </nav>
  );
}
