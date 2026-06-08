"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuditFormState } from "@/app/(dashboard)/auditorias/actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Salvar conclusão"}
    </button>
  );
}

export function ConclusionForm({
  action,
  defaultValue,
}: {
  action: (prev: AuditFormState, formData: FormData) => Promise<AuditFormState>;
  defaultValue: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-3">
      <textarea
        name="conclusion"
        rows={4}
        defaultValue={defaultValue}
        placeholder="Parecer geral da auditoria: eficácia do sistema, principais constatações, recomendação quanto à certificação/manutenção..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      <div className="flex items-center gap-3">
        <SaveButton />
        {state?.ok && (
          <span className="text-xs font-medium text-emerald-600">Conclusão salva.</span>
        )}
        {state?.error && (
          <span className="text-xs font-medium text-red-600">{state.error}</span>
        )}
      </div>
    </form>
  );
}
