import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientWhereForUser } from "@/lib/session";

export interface SearchResults {
  clients: { id: string; name: string; secondary?: string; href: string }[];
  projects: { id: string; name: string; secondary?: string; href: string }[];
  requirements: { id: string; name: string; secondary?: string; href: string }[];
}

const EMPTY: SearchResults = { clients: [], projects: [], requirements: [] };

// Busca global escopada pelos clientes a que o usuário tem acesso. Retorna
// resultados agrupados (clientes / projetos / requisitos) com o href de navegação.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json(EMPTY);

  // Mesmo escopo de acesso usado em todo o app (organização + clientes vinculados).
  const clientScope = await clientWhereForUser(session.user.id);

  const [clients, projects, requirements] = await Promise.all([
    prisma.client.findMany({
      where: {
        ...clientScope,
        OR: [
          { name: { contains: q } },
          { cnpj: { contains: q } },
          { segment: { contains: q } },
        ],
      },
      select: { id: true, name: true, segment: true },
      take: 5,
      orderBy: { name: "asc" },
    }),
    prisma.isoProject.findMany({
      where: { client: clientScope, type: { contains: q } },
      select: { id: true, type: true, client: { select: { name: true } } },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.projectRequirement.findMany({
      where: {
        project: { client: clientScope },
        requirement: {
          OR: [{ code: { contains: q } }, { title: { contains: q } }],
        },
      },
      select: {
        id: true,
        projectId: true,
        requirement: { select: { code: true, title: true } },
      },
      take: 6,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const results: SearchResults = {
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      secondary: c.segment ?? undefined,
      href: `/clientes/${c.id}`,
    })),
    projects: projects.map((p) => ({
      id: p.id,
      name: p.type,
      secondary: p.client.name,
      href: `/projetos/${p.id}`,
    })),
    requirements: requirements.map((r) => ({
      id: r.id,
      name: `${r.requirement.code} ${r.requirement.title}`,
      secondary: undefined,
      href: `/projetos/${r.projectId}/requisitos/${r.id}`,
    })),
  };

  return NextResponse.json(results);
}
