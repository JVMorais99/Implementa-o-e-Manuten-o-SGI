import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";

// Tokens de uso único para fluxos de autenticação por e-mail. O valor em claro
// é gerado aleatoriamente e devolvido ao chamador (vai no link); no banco fica
// apenas o seu hash SHA-256. consumeToken valida, checa validade e apaga.

export type AuthTokenType = "INVITE" | "RESET" | "VERIFY";

const TTL_HOURS: Record<AuthTokenType, number> = {
  INVITE: 72,
  RESET: 2,
  VERIFY: 72,
};

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

// Cria um token para o e-mail/tipo, removendo tokens anteriores do mesmo par
// (apenas o mais recente vale). Retorna o valor em claro para montar o link.
export async function createToken(
  email: string,
  type: AuthTokenType
): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + TTL_HOURS[type] * 60 * 60 * 1000);

  await prisma.authToken.deleteMany({ where: { email, type } });
  await prisma.authToken.create({ data: { email, tokenHash, type, expiresAt } });
  return raw;
}

// Valida e consome (apaga) um token. Retorna o e-mail associado ou null se
// inválido/expirado.
export async function consumeToken(
  raw: string,
  type: AuthTokenType
): Promise<string | null> {
  if (!raw) return null;
  const tokenHash = hashToken(raw);
  const record = await prisma.authToken.findUnique({ where: { tokenHash } });
  if (!record || record.type !== type) return null;

  await prisma.authToken.delete({ where: { tokenHash } }).catch(() => {});
  if (record.expiresAt.getTime() < Date.now()) return null;
  return record.email;
}

// Apenas inspeciona um token (sem consumir) — usado para validar antes de
// renderizar o formulário de redefinição/aceite.
export async function peekToken(
  raw: string,
  type: AuthTokenType
): Promise<string | null> {
  if (!raw) return null;
  const record = await prisma.authToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  });
  if (!record || record.type !== type) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;
  return record.email;
}
