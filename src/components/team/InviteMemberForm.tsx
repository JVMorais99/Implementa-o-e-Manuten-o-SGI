"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { MemberFormState } from "@/app/(dashboard)/equipe/actions";
import { ORG_ROLES, ORG_ROLE_LABELS, type OrgRole } from "@/lib/enums";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Adicionando..." : "Adicionar membro"}
    </button>
  );
}

export function InviteMemberForm({
  action,
  clients,
}: {
  action: (prev: MemberFormState, formData: FormData) => Promise<MemberFormState>;
  clients: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [role, setRole] = useState<OrgRole>("CONSULTOR");

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nome <span className="text-red-500">*</span>
          </label>
          <input name="name" required className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            E-mail <span className="text-red-500">*</span>
          </label>
          <input name="email" type="email" required className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Papel <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as OrgRole)}
            className={inputCls}
          >
            {ORG_ROLES.map((r) => (
              <option key={r} value={r}>
                {ORG_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {role !== "ADMIN" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Clientes vinculados <span className="text-red-500">*</span>
          </label>
          {clients.length === 0 ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Cadastre um cliente antes de vincular este usuário.
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
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-400">
            O usuário verá apenas os clientes selecionados (clientes, projetos,
            auditorias e relatórios).
          </p>
        </div>
      )}

      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.ok}
          {state.link && (
            <a
              href={state.link}
              className="mt-1 block break-all font-medium text-emerald-800 underline"
            >
              {state.link}
            </a>
          )}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
