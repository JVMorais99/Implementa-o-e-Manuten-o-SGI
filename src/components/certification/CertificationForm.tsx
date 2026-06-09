"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { CertFormState } from "@/app/(dashboard)/manutencao/actions";
import {
  CERTIFICATION_STATUSES,
  CERTIFICATION_STATUS_LABELS,
} from "@/lib/enums";
import { formatDateInput } from "@/lib/utils";

export type ClientOption = { id: string; name: string };
export type StandardOption = { id: string; code: string; name: string };

export type CertDefaults = {
  clientId: string;
  standardId: string;
  certifyingBody: string | null;
  certificateNo: string | null;
  scope: string | null;
  issuedAt: Date;
  expiresAt: Date;
  surveillanceIntervalMonths: number;
  status: string;
  notes: string | null;
};

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending
        ? "Salvando..."
        : editing
          ? "Salvar alterações"
          : "Registrar certificação"}
    </button>
  );
}

export function CertificationForm({
  action,
  clients,
  standards,
  defaultClientId,
  cert,
}: {
  action: (prev: CertFormState, formData: FormData) => Promise<CertFormState>;
  clients: ClientOption[];
  standards: StandardOption[];
  defaultClientId?: string;
  cert?: CertDefaults;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const router = useRouter();
  const editing = !!cert;

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Cliente <span className="text-red-500">*</span>
          </label>
          {editing ? (
            <>
              <input type="hidden" name="clientId" value={cert.clientId} />
              <p className={`${inputCls} bg-gray-50 text-gray-500`}>
                {clients.find((c) => c.id === cert.clientId)?.name ?? "—"}
              </p>
            </>
          ) : (
            <select
              name="clientId"
              required
              defaultValue={defaultClientId ?? ""}
              className={inputCls}
            >
              <option value="" disabled>
                Selecione o cliente
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Norma <span className="text-red-500">*</span>
          </label>
          {editing ? (
            <>
              <input type="hidden" name="standardId" value={cert.standardId} />
              <p className={`${inputCls} bg-gray-50 text-gray-500`}>
                {standards.find((s) => s.id === cert.standardId)?.code ?? "—"}
              </p>
            </>
          ) : (
            <select name="standardId" required defaultValue="" className={inputCls}>
              <option value="" disabled>
                Selecione a norma
              </option>
              {standards.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Organismo certificador
          </label>
          <input
            name="certifyingBody"
            defaultValue={cert?.certifyingBody ?? ""}
            placeholder="Ex.: BSI, DNV, Fundação Vanzolini..."
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nº do certificado
          </label>
          <input
            name="certificateNo"
            defaultValue={cert?.certificateNo ?? ""}
            className={inputCls}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Emissão <span className="text-red-500">*</span>
          </label>
          <input
            name="issuedAt"
            type="date"
            required
            defaultValue={cert ? formatDateInput(cert.issuedAt) : ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Validade <span className="text-red-500">*</span>
          </label>
          <input
            name="expiresAt"
            type="date"
            required
            defaultValue={cert ? formatDateInput(cert.expiresAt) : ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Vigilância (meses)
          </label>
          <input
            name="surveillanceIntervalMonths"
            type="number"
            min={0}
            max={60}
            defaultValue={cert?.surveillanceIntervalMonths ?? 12}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-gray-400">0 = sem ciclo de manutenção.</p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Escopo certificado
        </label>
        <textarea
          name="scope"
          rows={2}
          defaultValue={cert?.scope ?? ""}
          className={inputCls}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            defaultValue={cert?.status ?? "ATIVA"}
            className={inputCls}
          >
            {CERTIFICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CERTIFICATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Observações</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={cert?.notes ?? ""}
          className={inputCls}
        />
      </div>

      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton editing={editing} />
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
