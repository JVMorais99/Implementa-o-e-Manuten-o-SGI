"use client";

import { Suspense, useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
    >
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

function StatusBanner() {
  const params = useSearchParams();
  const message = params.get("registered")
    ? "Conta criada com sucesso. Faça login para continuar."
    : params.get("reset")
      ? "Senha redefinida com sucesso. Faça login com a nova senha."
      : params.get("invited")
        ? "Convite aceito! Faça login para acessar."
        : null;
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      {message}
    </div>
  );
}

export default function LoginPage() {
  const [error, formAction] = useActionState(loginAction, undefined);

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-800">Acessar conta</h2>
      <p className="mb-5 text-sm text-gray-500">
        Entre para gerenciar seus clientes e projetos ISO.
      </p>

      <Suspense fallback={null}>
        <StatusBanner />
      </Suspense>

      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            name="email"
            type="email"
            required
            defaultValue="consultor@iso.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="voce@empresa.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Senha
          </label>
          <input
            name="password"
            type="password"
            required
            defaultValue="senha123"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="text-right">
          <Link
            href="/recuperar-senha"
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>

        <SubmitButton />
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        Não tem conta?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          Criar conta
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-gray-400">
        Demo: consultor@iso.com / senha123
      </p>
    </div>
  );
}
