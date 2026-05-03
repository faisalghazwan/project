"use client";

type Input = { name: string; value: string };

const variants = {
  ghost:
    "inline-flex h-9 items-center rounded-md px-3 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800",
  link: "text-xs text-zinc-400 hover:text-red-600 underline-offset-4 hover:underline",
} as const;

export function ConfirmButton({
  action,
  inputs,
  confirmMessage,
  label,
  variant = "link",
}: {
  action: (formData: FormData) => void | Promise<void>;
  inputs: Input[];
  confirmMessage: string;
  label: string;
  variant?: keyof typeof variants;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {inputs.map((i) => (
        <input key={i.name} type="hidden" name={i.name} value={i.value} />
      ))}
      <button type="submit" className={variants[variant]}>
        {label}
      </button>
    </form>
  );
}
