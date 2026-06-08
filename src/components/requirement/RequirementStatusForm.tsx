"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/(dashboard)/projetos/[id]/requisitos/[prId]/actions";
import {
  PROJECT_REQUIREMENT_STATUSES,
  REQUIREMENT_STATUS_LABELS,
  type ProjectRequirementStatus,
} from "@/lib/enums";
import { formatDateInput } from "@/lib/utils";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}

export function RequirementStatusForm({
  action,
  defaults,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaults: {
    status: string;
    consultantNotes?: string | null;
    clientNotes?: string | null;
    responsible?: string | null;
    dueDate?: Date | string | null;
    completionPercent: number;
  };
}) {
  const [state, formAction] = useActionState(action, undefined);
  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
          <select name="status" defaultValue={defaults.status} className={inputCls}>
            {PROJECT_REQUIREMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {REQUIREMENT_STATUS_LABELS[s as ProjectRequirementStatus]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Conclusão (%)
          </label>
          <input
            name="completionPercent"
            type="number"
            min={0}
            max={100}
            defaultValue={defaults.completionPercent}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Responsável
          </label>
          <input
            name="responsible"
            type="text"
            defaultValue={defaults.responsible ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Prazo</label>
          <input
            name="dueDate"
            type="date"
            defaultValue={formatDateInput(defaults.dueDate)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Notas do consultor
        </label>
        <textarea
          name="consultantNotes"
          rows={3}
          defaultValue={defaults.consultantNotes ?? ""}
          placeholder="Observações técnicas, análise da evidência, lacunas identificadas..."
          className={inputCls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Notas do cliente
        </label>
        <textarea
          name="clientNotes"
          rows={2}
          defaultValue={defaults.clientNotes ?? ""}
          className={inputCls}
        />
      </div>

      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Requisito atualizado.
        </div>
      )}

      <SaveButton />
    </form>
  );
}
