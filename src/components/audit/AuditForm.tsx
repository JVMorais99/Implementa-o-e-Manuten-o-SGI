"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { AuditFormState } from "@/app/(dashboard)/auditorias/actions";
import { AUDIT_TYPES, AUDIT_TYPE_LABELS, type AuditType } from "@/lib/enums";

export type ProjectOption = {
  id: string;
  label: string; // "Cliente — Tipo (normas)"
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Criando auditoria..." : "Criar auditoria"}
    </button>
  );
}

export function AuditForm({
  action,
  projects,
  defaultProjectId,
}: {
  action: (prev: AuditFormState, formData: FormData) => Promise<AuditFormState>;
  projects: ProjectOption[];
  defaultProjectId?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const router = useRouter();
  const [type, setType] = useState<AuditType>("INTERNA");

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Projeto auditado <span className="text-red-500">*</span>
        </label>
        <select
          name="projectId"
          required
          defaultValue={defaultProjectId ?? ""}
          className={inputCls}
        >
          <option value="" disabled>
            Selecione o projeto
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">
          O checklist de requisitos é gerado automaticamente a partir da trilha do projeto.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Tipo de auditoria <span className="text-red-500">*</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {AUDIT_TYPES.map((t) => {
            const checked = type === t;
            return (
              <label
                key={t}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm transition ${
                  checked
                    ? "border-brand-300 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={checked}
                  onChange={() => setType(t)}
                  className="h-4 w-4 accent-brand-600"
                />
                <span className="font-medium text-gray-800">
                  {AUDIT_TYPE_LABELS[t]}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          required
          placeholder={
            type === "INTERNA"
              ? "Auditoria interna do SGI — 1º ciclo"
              : "Auditoria de certificação — fase 2"
          }
          className={inputCls}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Auditor líder
          </label>
          <input name="leadAuditor" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {type === "EXTERNA"
              ? "Organismo certificador / auditor externo"
              : "Equipe auditora"}
          </label>
          <input
            name={type === "EXTERNA" ? "auditedOrg" : "auditTeam"}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Data planejada
          </label>
          <input name="plannedDate" type="date" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select name="status" defaultValue="PLANEJADA" className={inputCls}>
            <option value="PLANEJADA">Planejada</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Escopo</label>
        <textarea name="scope" rows={2} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Objetivo</label>
        <textarea name="objective" rows={2} className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Critérios da auditoria
        </label>
        <textarea
          name="criteria"
          rows={2}
          placeholder="Normas, procedimentos internos, requisitos legais aplicáveis..."
          className={inputCls}
        />
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
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
