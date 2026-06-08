"use client";

import { useFormStatus } from "react-dom";

function Inner({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "Excluindo..." : label}
    </button>
  );
}

export function DeleteButton({
  action,
  label = "Excluir",
  confirmMessage = "Tem certeza? Esta ação não pode ser desfeita.",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmMessage?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <Inner label={label} />
    </form>
  );
}
