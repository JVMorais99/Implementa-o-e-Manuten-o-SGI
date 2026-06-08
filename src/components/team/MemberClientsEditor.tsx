"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { MemberFormState } from "@/app/(dashboard)/equipe/actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Salvar clientes"}
    </button>
  );
}

export function MemberClientsEditor({
  action,
  clients,
  selectedIds,
}: {
  action: (prev: MemberFormState, formData: FormData) => Promise<MemberFormState>;
  clients: { id: string; name: string }[];
  selectedIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
      >
        {open ? "Fechar" : "Editar clientes"}
      </button>

      {open && (
        <form action={formAction} className="mt-2 w-full space-y-2">
          {clients.length === 0 ? (
            <p className="text-xs text-amber-700">
              Nenhum cliente cadastrado na organização.
            </p>
          ) : (
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {clients.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    name="clientIds"
                    value={c.id}
                    defaultChecked={selectedIds.includes(c.id)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          )}

          {state?.error && (
            <p className="text-xs text-red-600">{state.error}</p>
          )}
          {state?.ok && (
            <p className="text-xs text-emerald-700">{state.ok}</p>
          )}

          <SaveButton />
        </form>
      )}
    </div>
  );
}
