"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/(dashboard)/projetos/[id]/requisitos/[prId]/actions";
import {
  DOCUMENT_STATUSES,
  DOCUMENT_STATUS_LABELS,
  type DocumentStatus,
} from "@/lib/enums";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Salvar documento"}
    </button>
  );
}

function ToolbarButton({
  label,
  command,
  value,
}: {
  label: string;
  command: string;
  value?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        document.execCommand(command, false, value);
      }}
      className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
    >
      {label}
    </button>
  );
}

export function DocumentEditor({
  action,
  doc,
  exportHref,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  doc: {
    title: string;
    contentHtml: string;
    status: string;
    revision: number;
  };
  exportHref: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [initialHtml] = useState(doc.contentHtml);

  const syncHidden = () => {
    if (hiddenRef.current && editorRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
    }
  };

  return (
    <form action={formAction} onSubmit={syncHidden} className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          name="title"
          defaultValue={doc.title}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <select
          name="status"
          defaultValue={doc.status}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        >
          {DOCUMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {DOCUMENT_STATUS_LABELS[s as DocumentStatus]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 p-2">
        <ToolbarButton label="Negrito" command="bold" />
        <ToolbarButton label="Título" command="formatBlock" value="h2" />
        <ToolbarButton label="Subtítulo" command="formatBlock" value="h3" />
        <ToolbarButton label="Parágrafo" command="formatBlock" value="p" />
        <ToolbarButton label="Lista" command="insertUnorderedList" />
        <span className="ml-auto text-xs text-gray-400">
          Edite o conteúdo antes de exportar
        </span>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncHidden}
        className="doc-content min-h-[400px] rounded-xl border border-gray-200 bg-white p-6 text-sm leading-relaxed text-gray-800 outline-none focus:border-brand-300"
        dangerouslySetInnerHTML={{ __html: initialHtml }}
      />
      <input ref={hiddenRef} type="hidden" name="contentHtml" defaultValue={doc.contentHtml} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nota de alteração{" "}
            <span className="font-normal text-gray-400">(opcional)</span>
          </label>
          <input
            name="changeNote"
            placeholder="Ex.: Incluída matriz de forças e ações recomendadas"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-500">
          Revisão atual: {String(doc.revision).padStart(2, "0")}
        </span>
      </div>

      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Documento salvo.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SaveButton />
        <a
          href={exportHref}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Exportar Word (.docx)
        </a>
        <a
          href={`${exportHref}?format=pdf`}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Exportar PDF
        </a>
      </div>
    </form>
  );
}
