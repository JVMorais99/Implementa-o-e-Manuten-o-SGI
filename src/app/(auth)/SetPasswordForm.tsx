"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { AuthFormState } from "./actions";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

// Formulário genérico de definição de senha (token oculto), reutilizado pela
// redefinição de senha e pelo aceite de convite.
export function SetPasswordForm({
  action,
  token,
  submitLabel,
  pendingLabel,
}: {
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  token: string;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  const inputCls =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Nova senha</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className={inputCls}
          placeholder="Mínimo 6 caracteres"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Confirmar senha
        </label>
        <input name="confirm" type="password" required minLength={6} className={inputCls} />
      </div>

      {state?.error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />

      <p className="text-center text-sm text-gray-500">
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
