"use client";

import { deleteSession } from "@/app/actions";

export function DeleteSessionButton({ sessionId }: { sessionId: number }) {
  return (
    <form
      action={deleteSession}
      onSubmit={(e) => {
        if (!confirm("delete this session?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <button
        type="submit"
        className="text-xs text-zinc-400 hover:text-red-600"
      >
        delete
      </button>
    </form>
  );
}
