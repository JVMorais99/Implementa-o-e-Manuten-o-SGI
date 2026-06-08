import Link from "next/link";
import { peekToken } from "@/lib/tokens";
import { acceptInvite } from "../actions";
import { SetPasswordForm } from "../SetPasswordForm";

export default async function AceitarConvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const email = token ? await peekToken(token, "INVITE") : null;

  if (!email) {
    return (
      <div>
        <h2 className="mb-1 text-lg font-semibold text-gray-800">Convite inválido</h2>
        <p className="mb-5 text-sm text-gray-500">
          Este convite é inválido ou já expirou. Peça um novo ao administrador da
          organização.
        </p>
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold text-gray-800">Aceitar convite</h2>
      <p className="mb-5 text-sm text-gray-500">
        Você foi convidado como <strong>{email}</strong>. Defina uma senha para acessar.
      </p>
      <SetPasswordForm
        action={acceptInvite}
        token={token as string}
        submitLabel="Definir senha e entrar"
        pendingLabel="Salvando..."
      />
    </div>
  );
}
