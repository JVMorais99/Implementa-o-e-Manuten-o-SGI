"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { FormState } from "@/app/(dashboard)/clientes/actions";

type ClientDefaults = {
  name?: string;
  cnpj?: string | null;
  unit?: string | null;
  responsible?: string | null;
  contact?: string | null;
  segment?: string | null;
  scope?: string | null;
  notes?: string | null;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Salvando..." : label}
    </button>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}

export function ClientForm({
  action,
  defaults,
  submitLabel = "Salvar cliente",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaults?: ClientDefaults;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const router = useRouter();

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do cliente" name="name" defaultValue={defaults?.name} required placeholder="Empresa ABC Ltda." />
        <Field label="CNPJ" name="cnpj" defaultValue={defaults?.cnpj} placeholder="00.000.000/0001-00" />
        <Field label="Unidade" name="unit" defaultValue={defaults?.unit} placeholder="Matriz / Filial" />
        <Field label="Responsável do cliente" name="responsible" defaultValue={defaults?.responsible} placeholder="Nome do contato" />
        <Field label="Contato" name="contact" defaultValue={defaults?.contact} placeholder="E-mail ou telefone" />
        <Field label="Segmento" name="segment" defaultValue={defaults?.segment} placeholder="Indústria, serviços..." />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Escopo</label>
        <textarea
          name="scope"
          rows={2}
          defaultValue={defaults?.scope ?? ""}
          placeholder="Escopo do sistema de gestão do cliente"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Observações</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={defaults?.notes ?? ""}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
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
