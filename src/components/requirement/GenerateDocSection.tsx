"use client";

import { useFormStatus } from "react-dom";

export type TemplateOption = {
  id: string;
  name: string;
  documentType: string;
  description: string;
  action: () => Promise<void>;
};

function GenerateButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Gerando..." : "Gerar"}
    </button>
  );
}

export function GenerateDocSection({ templates }: { templates: TemplateOption[] }) {
  if (templates.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Nenhum modelo de documento disponível para este requisito.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {templates.map((tpl) => (
        <div
          key={tpl.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800">{tpl.name}</p>
            <p className="text-xs text-gray-500">{tpl.description}</p>
          </div>
          <form action={tpl.action}>
            <GenerateButton />
          </form>
        </div>
      ))}
    </div>
  );
}
