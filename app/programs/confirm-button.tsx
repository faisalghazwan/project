"use client";

type Input = { name: string; value: string };

export function ConfirmButton({
  action,
  inputs,
  confirmMessage,
  label,
}: {
  action: (formData: FormData) => void | Promise<void>;
  inputs: Input[];
  confirmMessage: string;
  label: string;
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
      <button
        type="submit"
        className="text-xs text-zinc-400 hover:text-red-600"
      >
        {label}
      </button>
    </form>
  );
}
