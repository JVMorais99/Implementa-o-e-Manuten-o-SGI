import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { can, ForbiddenError, type Capability } from "@/lib/permissions";
import type { OrgRole } from "@/lib/enums";

// Retorna a sessão do usuário logado ou redireciona para /login.
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user;
}

export interface AccessContext {
  user: { id: string; name?: string | null; email?: string | null };
  orgId: string | null;
  role: OrgRole;
  // null  = sem restrição de cliente (ADMIN: vê todos da organização)
  // array = restrito a estes clientes ([] = não vê nenhum)
  clientIds: string[] | null;
}

// Resolve o contexto de acesso de um usuário (papel + escopo de clientes) a partir do
// seu membership mais antigo. Separado de getContext para ser reutilizável fora de uma
// requisição autenticada (ex.: o cron de digest itera vários usuários).
export async function buildUserContext(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}): Promise<AccessContext> {
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { clients: { select: { clientId: true } } },
  });
  const role = (membership?.role as OrgRole) ?? "LEITOR";
  return {
    user,
    orgId: membership?.organizationId ?? null,
    role,
    clientIds: role === "ADMIN" ? null : (membership?.clients.map((c) => c.clientId) ?? []),
  };
}

// Contexto de acesso do usuário logado: organização ativa, papel e o conjunto de
// clientes atrelados (escopo de dados). ADMIN vê todos os clientes da organização
// (clientIds = null); os demais papéis só veem os clientes vinculados ao membership.
export async function getContext(): Promise<AccessContext> {
  const user = await requireUser();
  return buildUserContext(user);
}

// Filtro Prisma de acesso a clientes: restringe à organização e ao conjunto de
// clientes vinculados ao usuário. Use como `where` em Client ou aninhado em `client:`.
export function clientWhere(ctx: AccessContext) {
  return {
    // orgId nulo (usuário sem vínculo) → filtro impossível, nega acesso.
    organizationId: ctx.orgId ?? "__no_org__",
    // clientIds nulo (ADMIN) → sem restrição; array vazio → não vê nenhum cliente.
    ...(ctx.clientIds
      ? { id: { in: ctx.clientIds.length ? ctx.clientIds : ["__none__"] } }
      : {}),
  };
}

// Garante uma capacidade; lança ForbiddenError caso contrário (capturável nas actions).
export function requireCapability(ctx: AccessContext, capability: Capability) {
  if (!can(ctx.role, capability)) {
    throw new ForbiddenError();
  }
}

// Variante para route handlers (sem redirect): resolve o escopo de cliente a
// partir do userId já autenticado.
export async function clientWhereForUser(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { clients: { select: { clientId: true } } },
  });
  const base = { organizationId: membership?.organizationId ?? "__no_org__" };
  if ((membership?.role as OrgRole) === "ADMIN") return base;
  const ids = membership?.clients.map((c) => c.clientId) ?? [];
  return { ...base, id: { in: ids.length ? ids : ["__none__"] } };
}
