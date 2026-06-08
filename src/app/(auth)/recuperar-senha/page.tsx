"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { requestPasswordReset } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Enviando..." : "Enviar link de redefinição"}
    </button>
  );
}

export default function RecuperarSenhaPage() {
  const [state, formAction] = useActionState(requestPasswordReset, undefined);

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-800">Esqueci minha senha</h2>
      <p className="mb-5 text-sm text-gray-500">
        Informe seu e-mail e enviaremos um link para criar uma nova senha.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="voce@empresa.com"
          />
        </div>

        {state?.error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {state.error}
          </div>
        )}
        {state?.ok && (
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {state.ok}
            {state.link && (
              <Link
                href={state.link}
                className="mt-1 block break-all font-medium text-brand-600 hover:underline"
              >
                {state.link}
              </Link>
            )}
          </div>
        )}

        <SubmitButton />
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
