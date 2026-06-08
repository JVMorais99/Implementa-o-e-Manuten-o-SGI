"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AiActionState } from "@/app/(dashboard)/projetos/[id]/requisitos/[prId]/ai-actions";
import { RequirementStatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

type AiAction = (prev: AiActionState, formData: FormData) => Promise<AiActionState>;

function ActionButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 transition hover:bg-violet-100 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function Feedback({ state }: { state: AiActionState }) {
  if (!state) return null;
  if (state.error)
    return <p className="mt-2 text-xs text-red-600">{state.error}</p>;
  if (state.ok)
    return <p className="mt-2 text-xs text-emerald-600">{state.ok}</p>;
  return null;
}

export function AiAssistant({
  enabled,
  canEdit,
  suggestedStatus,
  rationale,
  evaluatedAt,
  suggestAction,
  planAction,
  applyAction,
}: {
  enabled: boolean;
  canEdit: boolean;
  suggestedStatus: string | null;
  rationale: string | null;
  evaluatedAt: Date | string | null;
  suggestAction: AiAction;
  planAction: AiAction;
  applyAction: AiAction;
}) {
  const [suggestState, suggestForm] = useActionState(suggestAction, undefined);
  const [planState, planForm] = useActionState(planAction, undefined);
  const [applyState, applyForm] = useActionState(applyAction, undefined);

  if (!enabled) {
    return (
      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        Assistente de IA desativado. Configure <code>ANTHROPIC_API_KEY</code> para
        habilitar análise de evidências, sugestão de conformidade e geração de plano de
        ação.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <form action={suggestForm}>
          <ActionButton label="Sugerir conformidade" pendingLabel="Analisando..." />
        </form>
        <form action={planForm}>
          <ActionButton label="Gerar plano de ação" pendingLabel="Gerando..." />
        </form>
      </div>
      <Feedback state={suggestState} />
      <Feedback state={planState} />

      {suggestedStatus && (
        <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Sugestão da IA
            </span>
            <RequirementStatusBadge status={suggestedStatus} />
            {evaluatedAt && (
              <span className="text-xs text-gray-400">· {formatDate(evaluatedAt)}</span>
            )}
          </div>
          {rationale && (
            <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{rationale}</p>
          )}
          {canEdit && (
            <form action={applyForm} className="mt-2">
              <button
                type="submit"
                className="text-xs font-medium text-violet-700 underline hover:text-violet-900"
              >
                Aplicar status sugerido
              </button>
            </form>
          )}
          <Feedback state={applyState} />
          <p className="mt-2 text-[11px] text-gray-400">
            Sugestão consultiva — a decisão final é do consultor.
          </p>
        </div>
      )}
    </div>
  );
}
