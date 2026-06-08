"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { FormState } from "@/app/(dashboard)/projetos/actions";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/enums";

type ClientOption = { id: string; name: string };
type StandardOption = { id: string; code: string; name: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Criando projeto..." : "Criar projeto"}
    </button>
  );
}

export function ProjectForm({
  action,
  clients,
  standards,
  defaultClientId,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  clients: ClientOption[];
  standards: StandardOption[];
  defaultClientId?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Cliente <span className="text-red-500">*</span>
          </label>
          <select name="clientId" required defaultValue={defaultClientId ?? ""} className={inputCls}>
            <option value="" disabled>
              Selecione o cliente
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tipo de projeto <span className="text-red-500">*</span>
          </label>
          <input
            name="type"
            required
            list="project-types"
            placeholder="Implantação ISO 9001"
            className={inputCls}
          />
          <datalist id="project-types">
            <option value="Implantação ISO 9001" />
            <option value="Manutenção ISO 9001" />
            <option value="Diagnóstico ISO 9001" />
            <option value="Preparação para auditoria externa" />
            <option value="SGI 9001 + 14001 + 45001" />
          </datalist>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Normas aplicáveis <span className="text-red-500">*</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {standards.map((s) => {
            const checked = selected.includes(s.id);
            return (
              <label
                key={s.id}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition ${
                  checked
                    ? "border-brand-300 bg-brand-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  name="standardIds"
                  value={s.id}
                  checked={checked}
                  onChange={() => toggle(s.id)}
                  className="mt-0.5 h-4 w-4 accent-brand-600"
                />
                <span>
                  <span className="font-semibold text-gray-800">{s.code}</span>
                  <span className="block text-xs text-gray-500">{s.name}</span>
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          A trilha de requisitos será gerada automaticamente a partir das normas selecionadas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Data de início</label>
          <input name="startDate" type="date" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Prazo</label>
          <input name="dueDate" type="date" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Responsável</label>
          <input name="responsible" type="text" placeholder="Consultor responsável" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
          <select name="status" defaultValue="EM_ANDAMENTO" className={inputCls}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s as ProjectStatus]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Observações</label>
        <textarea name="notes" rows={3} className={inputCls} />
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
