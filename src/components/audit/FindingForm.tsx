"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { AuditFormState } from "@/app/(dashboard)/auditorias/actions";
import { FINDING_TYPES, FINDING_TYPE_LABELS } from "@/lib/enums";

export type RequirementOption = { id: string; code: string; title: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Registrando..." : "Registrar constatação"}
    </button>
  );
}

export function FindingForm({
  action,
  requirements,
}: {
  action: (prev: AuditFormState, formData: FormData) => Promise<AuditFormState>;
  requirements: RequirementOption[];
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Limpa o formulário e fecha após salvar com sucesso.
  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-brand-300 hover:text-brand-600"
      >
        + Registrar constatação
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-xl bg-gray-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Tipo <span className="text-red-500">*</span>
          </label>
          <select name="type" required defaultValue="NC_MENOR" className={inputCls}>
            {FINDING_TYPES.map((t) => (
              <option key={t} value={t}>
                {FINDING_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Requisito relacionado
          </label>
          <select name="projectRequirementId" defaultValue="" className={inputCls}>
            <option value="">— (geral / sem requisito)</option>
            {requirements.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} — {r.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Descrição da constatação <span className="text-red-500">*</span>
        </label>
        <textarea name="description" rows={2} required className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Evidência objetiva
        </label>
        <textarea name="evidence" rows={2} className={inputCls} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Correção (ação imediata)
          </label>
          <textarea name="correction" rows={2} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Análise de causa-raiz
          </label>
          <textarea name="rootCause" rows={2} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">
          Ação corretiva
        </label>
        <textarea name="correctiveAction" rows={2} className={inputCls} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Responsável
          </label>
          <input name="responsible" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Prazo
          </label>
          <input name="dueDate" type="date" className={inputCls} />
        </div>
      </div>

      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
