"use client";

import { useFormStatus } from "react-dom";

function Inner({ revisionLabel }: { revisionLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-medium text-gray-500 hover:text-brand-600 disabled:opacity-60"
    >
      {pending ? "Restaurando..." : "Restaurar"}
    </button>
  );
}

export function RestoreButton({
  action,
  revisionLabel,
}: {
  action: () => Promise<void>;
  revisionLabel: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Restaurar o conteúdo da revisão ${revisionLabel}? Será criada uma nova revisão com esse conteúdo (o histórico é preservado).`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <Inner revisionLabel={revisionLabel} />
    </form>
  );
}
