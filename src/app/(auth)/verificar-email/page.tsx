import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { consumeToken } from "@/lib/tokens";

export default async function VerificarEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const email = token ? await consumeToken(token, "VERIFY") : null;

  if (email) {
    await prisma.user
      .update({ where: { email }, data: { emailVerified: new Date() } })
      .catch(() => {});
  }

  return (
    <div className="text-center">
      <h2 className="mb-1 text-lg font-semibold text-gray-800">
        {email ? "E-mail confirmado" : "Link inválido"}
      </h2>
      <p className="mb-5 text-sm text-gray-500">
        {email
          ? "Seu e-mail foi verificado com sucesso. Você já pode acessar sua conta."
          : "Este link de verificação é inválido ou já expirou."}
      </p>
      <Link href="/login" className="font-medium text-brand-600 hover:underline">
        Ir para o login
      </Link>
    </div>
  );
}
