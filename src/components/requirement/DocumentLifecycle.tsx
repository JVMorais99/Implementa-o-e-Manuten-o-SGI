"use client";

import { useFormStatus } from "react-dom";

// Painel de ciclo de vida do documento: envio ao cliente, recebimento assinado
// e aprovação. Cada botão dispara uma server action e registra uma revisão.

function StepButton({
  label,
  pendingLabel,
  variant,
  confirmMessage,
}: {
  label: string;
  pendingLabel: string;
  variant: "primary" | "secondary";
  confirmMessage: string;
}) {
  const { pending } = useFormStatus();
  const base =
    "w-full rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-brand-600 text-white hover:bg-brand-700"
      : "border border-gray-300 text-gray-700 hover:bg-gray-50";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${base} ${styles}`}
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentLifecycle({
  status,
  sentToClientAt,
  signedReceivedAt,
  sendAction,
  signAction,
  approveAction,
}: {
  status: string;
  sentToClientAt: Date | string | null;
  signedReceivedAt: Date | string | null;
  sendAction: () => Promise<void>;
  signAction: () => Promise<void>;
  approveAction: () => Promise<void>;
}) {
  const isApproved = status === "APROVADO";
  const isSigned = status === "RECEBIDO_ASSINADO" || isApproved;
  const isSent = status === "ENVIADO_CLIENTE" || isSigned;

  return (
    <div className="space-y-4">
      <ol className="space-y-3">
        <Stage
          done={isSent}
          title="Enviado ao cliente"
          at={formatDateTime(sentToClientAt)}
        />
        <Stage
          done={isSigned}
          title="Recebido assinado"
          at={formatDateTime(signedReceivedAt)}
        />
        <Stage done={isApproved} title="Aprovado" at={isApproved ? "concluído" : "—"} />
      </ol>

      <div className="space-y-2 border-t border-gray-100 pt-4">
        {!isSent && (
          <form action={sendAction}>
            <StepButton
              label="Enviar ao cliente"
              pendingLabel="Registrando envio..."
              variant="primary"
              confirmMessage="Registrar o envio deste documento ao cliente? Será criada uma revisão registrando o que foi enviado."
            />
          </form>
        )}
        {isSent && !isSigned && (
          <form action={signAction}>
            <StepButton
              label="Registrar recebimento assinado"
              pendingLabel="Registrando..."
              variant="primary"
              confirmMessage="Confirmar o recebimento do documento assinado pelo cliente?"
            />
          </form>
        )}
        {isSigned && !isApproved && (
          <form action={approveAction}>
            <StepButton
              label="Aprovar documento"
              pendingLabel="Aprovando..."
              variant="primary"
              confirmMessage="Aprovar definitivamente este documento?"
            />
          </form>
        )}
        {isApproved && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Documento aprovado — ciclo concluído.
          </p>
        )}
      </div>
    </div>
  );
}

function Stage({
  done,
  title,
  at,
}: {
  done: boolean;
  title: string;
  at: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-400"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <div>
        <p
          className={`text-sm font-medium ${done ? "text-gray-800" : "text-gray-400"}`}
        >
          {title}
        </p>
        <p className="text-xs text-gray-400">{at}</p>
      </div>
    </li>
  );
}
