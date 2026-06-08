"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { AuditFormState } from "@/app/(dashboard)/auditorias/actions";
import {
  AUDIT_ITEM_RESULTS,
  AUDIT_ITEM_RESULT_LABELS,
  AUDIT_ITEM_RESULT_COLORS,
  type AuditItemResult,
} from "@/lib/enums";

export type ChecklistItem = {
  id: string;
  code: string;
  title: string;
  norms: string[];
  result: string;
  notes: string | null;
  evidenceSampled: string | null;
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Salvar"}
    </button>
  );
}

export function AuditChecklistItem({
  item,
  action,
  readOnly = false,
}: {
  item: ChecklistItem;
  action: (prev: AuditFormState, formData: FormData) => Promise<AuditFormState>;
  readOnly?: boolean;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState(item.result);

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="py-3">
      <div className="flex items-center gap-3">
        <span className="w-12 shrink-0 text-sm font-semibold text-brand-700">
          {item.code}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-medium text-gray-800">{item.title}</p>
          <p className="text-xs text-gray-400">{item.norms.join(" · ")}</p>
        </button>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            AUDIT_ITEM_RESULT_COLORS[result as AuditItemResult] ??
            "bg-gray-100 text-gray-500"
          }`}
        >
          {AUDIT_ITEM_RESULT_LABELS[result as AuditItemResult] ?? result}
        </span>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 text-xs font-medium text-brand-600 hover:underline"
          >
            {open ? "Fechar" : "Avaliar"}
          </button>
        )}
      </div>

      {open && !readOnly && (
        <form action={formAction} className="mt-3 space-y-3 rounded-xl bg-gray-50 p-4">
          <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Resultado
              </label>
              <select
                name="result"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className={inputCls}
              >
                {AUDIT_ITEM_RESULTS.map((r) => (
                  <option key={r} value={r}>
                    {AUDIT_ITEM_RESULT_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Evidências amostradas
              </label>
              <input
                name="evidenceSampled"
                defaultValue={item.evidenceSampled ?? ""}
                placeholder="Documentos, registros e pessoas verificadas"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Anotações do auditor
            </label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={item.notes ?? ""}
              className={inputCls}
            />
          </div>
          <div className="flex items-center gap-3">
            <SaveButton />
            {state?.ok && (
              <span className="text-xs font-medium text-emerald-600">
                Item atualizado.
              </span>
            )}
            {state?.error && (
              <span className="text-xs font-medium text-red-600">{state.error}</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
