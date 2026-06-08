"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/(dashboard)/projetos/[id]/requisitos/[prId]/actions";
import {
  ACTION_PLAN_STATUSES,
  ACTION_PLAN_STATUS_LABELS,
  ACTION_PLAN_PRIORITIES,
  ACTION_PLAN_PRIORITY_LABELS,
  type ActionPlanStatus,
  type ActionPlanPriority,
} from "@/lib/enums";
import { ActionPlanStatusBadge, ActionPlanPriorityBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export type ActionPlanItem = {
  id: string;
  action: string;
  responsible: string | null;
  dueDate: Date | string | null;
  status: string;
  priority: string;
};

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Salvando..." : "Adicionar ação"}
    </button>
  );
}

export function ActionPlanSection({
  items,
  createAction,
  deleteAction,
}: {
  items: ActionPlanItem[];
  createAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (actionPlanId: string) => Promise<void>;
}) {
  const [state, formAction] = useActionState(createAction, undefined);
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
        <p className="text-sm text-gray-500">Nenhuma ação cadastrada.</p>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-gray-100 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-800">{item.action}</p>
                <form action={deleteAction.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="text-xs text-gray-400 hover:text-red-500"
                    title="Remover ação"
                  >
                    remover
                  </button>
                </form>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <ActionPlanStatusBadge status={item.status} />
                <ActionPlanPriorityBadge priority={item.priority} />
                {item.responsible && <span>· {item.responsible}</span>}
                <span>· Prazo: {formatDate(item.dueDate)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <form ref={ref} action={formAction} className="space-y-3 rounded-xl border border-gray-100 p-3">
          <textarea
            name="action"
            rows={2}
            required
            placeholder="Descreva a ação a ser realizada..."
            className={inputCls}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="responsible" placeholder="Responsável" className={inputCls} />
            <input name="dueDate" type="date" className={inputCls} />
            <select name="priority" defaultValue="MEDIA" className={inputCls}>
              {ACTION_PLAN_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  Prioridade: {ACTION_PLAN_PRIORITY_LABELS[p as ActionPlanPriority]}
                </option>
              ))}
            </select>
            <select name="status" defaultValue="ABERTO" className={inputCls}>
              {ACTION_PLAN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ACTION_PLAN_STATUS_LABELS[s as ActionPlanStatus]}
                </option>
              ))}
            </select>
          </div>
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
          <div className="flex gap-2">
            <AddButton />
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
          + Criar plano de ação
        </button>
      )}
    </div>
  );
}
