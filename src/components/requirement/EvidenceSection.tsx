"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/(dashboard)/projetos/[id]/requisitos/[prId]/actions";
import type { AiActionState } from "@/app/(dashboard)/projetos/[id]/requisitos/[prId]/ai-actions";
import {
  EVIDENCE_STATUSES,
  EVIDENCE_STATUS_LABELS,
  type EvidenceStatus,
} from "@/lib/enums";
import { EvidenceStatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

type AiAction = (prev: AiActionState, formData: FormData) => Promise<AiActionState>;

export type EvidenceItem = {
  id: string;
  title: string;
  type: string;
  fileName: string;
  status: string;
  technicalAnalysis: string | null;
  receivedAt: Date | string | null;
  expiresAt: Date | string | null;
  aiAnalysis?: string | null;
  aiSuggestedStatus?: string | null;
  aiConfidence?: number | null;
};

// Controles de IA por evidência: botão de análise e (após avaliação) aplicação
// do status sugerido. Cada item tem seu próprio estado de ação.
function EvidenceAiControls({
  evidenceId,
  canEdit,
  hasSuggestion,
  analyzeAction,
  applyAction,
}: {
  evidenceId: string;
  canEdit: boolean;
  hasSuggestion: boolean;
  analyzeAction: AiAction;
  applyAction: AiAction;
}) {
  const [analyzeState, analyzeForm] = useActionState(analyzeAction, undefined);
  const [applyState, applyForm] = useActionState(applyAction, undefined);

  function AnalyzeButton() {
    const { pending } = useFormStatus();
    return (
      <button
        type="submit"
        disabled={pending}
        className="text-violet-600 hover:underline disabled:opacity-60"
      >
        {pending ? "analisando..." : hasSuggestion ? "reanalisar (IA)" : "analisar (IA)"}
      </button>
    );
  }

  return (
    <>
      <form action={analyzeForm}>
        <input type="hidden" name="evidenceId" value={evidenceId} />
        <AnalyzeButton />
      </form>
      {canEdit && hasSuggestion && (
        <form action={applyForm}>
          <input type="hidden" name="evidenceId" value={evidenceId} />
          <button type="submit" className="text-violet-600 hover:underline">
            aplicar status
          </button>
        </form>
      )}
      {analyzeState?.error && (
        <span className="text-red-600">{analyzeState.error}</span>
      )}
      {applyState?.error && <span className="text-red-600">{applyState.error}</span>}
    </>
  );
}

// Extensões que conseguimos pré-visualizar online (inline ou convertendo
// para HTML na página de visualização). Alinhado a src/lib/evidence-preview.ts.
const VIEWABLE_EXT = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "txt",
  "csv",
  "json",
  "log",
  "md",
  "docx",
  "xlsx",
  "xls",
]);

function isViewable(fileName: string): boolean {
  const ext = (fileName.split(".").pop() ?? "").toLowerCase();
  return VIEWABLE_EXT.has(ext);
}

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Enviando..." : "Enviar evidência"}
    </button>
  );
}

export function EvidenceSection({
  items,
  uploadAction,
  deleteAction,
  defaultType,
  aiEnabled = false,
  canEdit = false,
  analyzeAction,
  applyAiStatusAction,
}: {
  items: EvidenceItem[];
  uploadAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (evidenceId: string) => Promise<void>;
  defaultType?: string;
  aiEnabled?: boolean;
  canEdit?: boolean;
  analyzeAction?: AiAction;
  applyAiStatusAction?: AiAction;
}) {
  const [state, formAction] = useActionState(uploadAction, undefined);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state]);

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="space-y-3">
      {items.length === 0 && !open && (
        <p className="text-sm text-gray-500">Nenhuma evidência anexada.</p>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((ev) => (
            <li key={ev.id} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{ev.title}</p>
                  <p className="truncate text-xs text-gray-400">
                    {ev.type} · {ev.fileName}
                  </p>
                </div>
                <EvidenceStatusBadge status={ev.status} />
              </div>
              {ev.technicalAnalysis && (
                <p className="mt-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
                  {ev.technicalAnalysis}
                </p>
              )}
              {ev.aiAnalysis && (
                <div className="mt-2 rounded-lg border border-violet-100 bg-violet-50/50 p-2 text-xs text-gray-700">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-semibold uppercase tracking-wide text-violet-600">
                      Análise da IA
                    </span>
                    {ev.aiSuggestedStatus && (
                      <EvidenceStatusBadge status={ev.aiSuggestedStatus} />
                    )}
                    {typeof ev.aiConfidence === "number" && (
                      <span className="text-gray-400">
                        confiança {ev.aiConfidence}%
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-line">{ev.aiAnalysis}</p>
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span>Recebida: {formatDate(ev.receivedAt)}</span>
                {ev.expiresAt && <span>· Validade: {formatDate(ev.expiresAt)}</span>}
                {isViewable(ev.fileName) && (
                  <a
                    href={`/evidencias/${ev.id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-600 hover:underline"
                  >
                    Visualizar
                  </a>
                )}
                <a
                  href={`/api/evidences/${ev.id}/download`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  Baixar
                </a>
                {aiEnabled && analyzeAction && applyAiStatusAction && (
                  <EvidenceAiControls
                    evidenceId={ev.id}
                    canEdit={canEdit}
                    hasSuggestion={Boolean(ev.aiSuggestedStatus)}
                    analyzeAction={analyzeAction}
                    applyAction={applyAiStatusAction}
                  />
                )}
                <form action={deleteAction.bind(null, ev.id)}>
                  <button type="submit" className="text-gray-400 hover:text-red-500">
                    remover
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <form ref={ref} action={formAction} className="space-y-3 rounded-xl border border-gray-100 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="title" required placeholder="Título da evidência" className={inputCls} />
            <input
              name="type"
              required
              defaultValue={defaultType}
              placeholder="Tipo (ex.: Matriz SWOT)"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Arquivo</label>
            <input name="file" type="file" required className={inputCls} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <select name="status" defaultValue="RECEBIDA" className={inputCls}>
              {EVIDENCE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {EVIDENCE_STATUS_LABELS[s as EvidenceStatus]}
                </option>
              ))}
            </select>
            <div>
              <label className="mb-1 block text-[11px] text-gray-400">Recebida em</label>
              <input name="receivedAt" type="date" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-gray-400">Validade</label>
              <input name="expiresAt" type="date" className={inputCls} />
            </div>
          </div>
          <textarea
            name="technicalAnalysis"
            rows={2}
            placeholder="Análise técnica: atende, atende parcialmente, não atende..."
            className={inputCls}
          />
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
          <div className="flex gap-2">
            <UploadButton />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-brand-200 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
        >
          + Upload de evidência
        </button>
      )}
    </div>
  );
}
