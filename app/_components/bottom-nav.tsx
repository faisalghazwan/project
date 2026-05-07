"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { startSession, useReps } from "@/lib/store";

type Tab = {
  href: string;
  label: string;
  match: (p: string) => boolean;
  icon: React.ReactNode;
};

const tabs: Tab[] = [
  {
    href: "/",
    label: "log",
    match: (p) => p === "/" || p.startsWith("/session"),
    icon: <HomeIcon />,
  },
  {
    href: "/exercises",
    label: "lifts",
    match: (p) => p.startsWith("/exercises") || p.startsWith("/exercise"),
    icon: <BarbellIcon />,
  },
  {
    href: "/programs",
    label: "plans",
    match: (p) => p.startsWith("/programs") || p.startsWith("/program"),
    icon: <CalendarIcon />,
  },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const reps = useReps();

  const inProgress = reps.sessions.find((s) => !s.finishedAt);

  function handleStart() {
    if (inProgress) {
      router.push(`/session?id=${inProgress.id}`);
      return;
    }
    const id = startSession();
    router.push(`/session?id=${id}`);
  }

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
              className={`group relative flex flex-col items-center justify-center gap-1 py-2.5 text-[10.5px] tracking-wide transition-colors ${
                active
                  ? "text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
              }`}
            >
              <span
                className={`absolute top-0 h-px w-8 transition-opacity ${
                  active
                    ? "bg-zinc-900 opacity-100 dark:bg-zinc-50"
                    : "opacity-0"
                }`}
              />
              {t.icon}
              <span>{t.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleStart}
          className="group flex flex-col items-center justify-center gap-1 py-2.5 text-[10.5px] tracking-wide text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform group-active:scale-95 ${
              inProgress
                ? "bg-amber-500 text-zinc-950"
                : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            }`}
          >
            {inProgress ? <DotIcon /> : <PlusIcon />}
          </span>
          <span>{inProgress ? "live" : "start"}</span>
        </button>
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
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
  );
}

function BarbellIcon() {
  return (
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
      <path d="M3 9.5v5" />
      <path d="M21 9.5v5" />
      <path d="M6 12h12" />
    </svg>
  );
}

function CalendarIcon() {
  return (
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
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="h-4 w-4"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function DotIcon() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inset-0 animate-ping rounded-full bg-zinc-950 opacity-75" />
      <span className="relative h-2 w-2 rounded-full bg-zinc-950" />
    </span>
  );
}
