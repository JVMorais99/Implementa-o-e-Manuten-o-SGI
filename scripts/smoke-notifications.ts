import { PrismaClient } from "@prisma/client";
import { getNotifications } from "../src/lib/notifications";
import type { AccessContext } from "../src/lib/session";

const prisma = new PrismaClient();

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

async function main() {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: "consultor@iso.com" },
  });
  const membership = await prisma.membership.findFirstOrThrow({
    where: { userId: user.id },
  });
  const iso = await prisma.isoStandard.findUniqueOrThrow({ where: { code: "ISO 9001" } });
  const req = await prisma.isoRequirement.findFirstOrThrow({
    where: { standardId: iso.id },
  });

  // Cenário isolado e idempotente.
  await prisma.client.deleteMany({
    where: { name: "Empresa Notif (smoke)", organizationId: membership.organizationId },
  });
  const client = await prisma.client.create({
    data: {
      userId: user.id,
      organizationId: membership.organizationId,
      name: "Empresa Notif (smoke)",
    },
  });
  const project = await prisma.isoProject.create({
    data: {
      clientId: client.id,
      type: "Implantação ISO 9001",
      status: "EM_ANDAMENTO",
      standards: { create: [{ standardId: iso.id }] },
      requirements: {
        create: [{ standardId: iso.id, requirementId: req.id, status: "NAO_INICIADO" }],
      },
    },
  });
  const pr = await prisma.projectRequirement.findFirstOrThrow({
    where: { projectId: project.id },
  });

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.actionPlan.create({
    data: {
      projectRequirementId: pr.id,
      action: "Ação vencida (smoke)",
      dueDate: yesterday,
      status: "ABERTO",
      priority: "ALTA",
    },
  });

  const ctx: AccessContext = {
    user: { id: user.id, name: user.name, email: user.email },
    orgId: membership.organizationId,
    role: "ADMIN",
    clientIds: null,
  };

  const notifications = await getNotifications(ctx);
  const found = notifications.find(
    (n) => n.kind === "ACTION_OVERDUE" && n.description.includes("Ação vencida (smoke)")
  );
  assert(Boolean(found), "deve detectar o plano de ação vencido");
  assert(found!.severity === "high", "plano vencido deve ser severidade alta");

  // Limpeza.
  await prisma.client.delete({ where: { id: client.id } });

  console.log("OK notificações:");
  console.log("  total detectadas no escopo:", notifications.length);
  console.log("  alerta:", found!.title, "->", found!.href);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
