import Link from "next/link";
import { peekToken } from "@/lib/tokens";
import { resetPassword } from "../actions";
import { SetPasswordForm } from "../SetPasswordForm";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const email = token ? await peekToken(token, "RESET") : null;

  if (!email) {
    return (
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-800">Link inválido</h2>
        <p className="mb-5 text-sm text-gray-500">
          Este link de redefinição é inválido ou já expirou.
        </p>
        <Link
          href="/recuperar-senha"
          className="font-medium text-brand-600 hover:underline"
        >
          Solicitar um novo link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-800">Definir nova senha</h2>
      <p className="mb-5 text-sm text-gray-500">
        Criando uma nova senha para <strong>{email}</strong>.
      </p>
      <SetPasswordForm
        action={resetPassword}
        token={token as string}
        submitLabel="Salvar nova senha"
        pendingLabel="Salvando..."
      />
    </div>
  );
}
