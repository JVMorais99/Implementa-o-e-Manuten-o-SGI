import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  ISO9001_REQUIREMENTS,
  type RequirementSeed,
} from "./data/iso9001-requirements";
import { ISO14001_REQUIREMENTS } from "./data/iso14001-requirements";
import { ISO45001_REQUIREMENTS } from "./data/iso45001-requirements";
import { ISO27001_REQUIREMENTS } from "./data/iso27001-requirements";
import { ISO37001_REQUIREMENTS } from "./data/iso37001-requirements";
import { ISO37301_REQUIREMENTS } from "./data/iso37301-requirements";
import { DOCUMENT_TEMPLATES } from "./data/templates";

const prisma = new PrismaClient();

async function seedStandard(
  code: string,
  name: string,
  description: string,
  requirements: RequirementSeed[]
) {
  const standard = await prisma.isoStandard.upsert({
    where: { code },
    update: { name, description },
    create: { code, name, description },
  });

  let order = 1;
  for (const req of requirements) {
    await prisma.isoRequirement.upsert({
      where: { standardId_code: { standardId: standard.id, code: req.code } },
      update: {
        title: req.title,
        description: req.description,
        consultantGuidance: req.consultantGuidance,
        suggestedQuestion: req.suggestedQuestion,
        expectedEvidence: JSON.stringify(req.expectedEvidence),
        order,
      },
      create: {
        standardId: standard.id,
        code: req.code,
        title: req.title,
        description: req.description,
        consultantGuidance: req.consultantGuidance,
        suggestedQuestion: req.suggestedQuestion,
        expectedEvidence: JSON.stringify(req.expectedEvidence),
        order,
      },
    });
    order++;
  }
  console.log(`✅ ${code}: ${requirements.length} requisitos`);
}

async function main() {
  console.log("🌱 Iniciando seed...");

  // 1) Usuário consultor demo
  const passwordHash = await bcrypt.hash("senha123", 10);
  const user = await prisma.user.upsert({
    where: { email: "consultor@iso.com" },
    update: {},
    create: {
      name: "Consultor Demo",
      email: "consultor@iso.com",
      passwordHash,
      role: "CONSULTOR",
    },
  });
  console.log(`👤 Usuário demo: ${user.email} / senha123`);

  // 1b) Organização do usuário demo + vínculo ADMIN
  let membership = await prisma.membership.findFirst({
    where: { userId: user.id, role: "ADMIN" },
  });
  if (!membership) {
    const org = await prisma.organization.create({
      data: { name: "Consultoria Demo" },
    });
    membership = await prisma.membership.create({
      data: { organizationId: org.id, userId: user.id, role: "ADMIN" },
    });
  }
  await prisma.client.updateMany({
    where: { userId: user.id, organizationId: null },
    data: { organizationId: membership.organizationId },
  });
  console.log(`🏢 Organização: ${membership.organizationId} (ADMIN)`);

  // 2) Catálogo de normas + requisitos (SGI: 9001, 14001, 45001)
  await seedStandard(
    "ISO 9001",
    "Sistemas de gestão da qualidade — Requisitos",
    "ISO 9001:2015 — Requisitos para sistemas de gestão da qualidade.",
    ISO9001_REQUIREMENTS
  );
  await seedStandard(
    "ISO 14001",
    "Sistemas de gestão ambiental — Requisitos com orientação para uso",
    "ISO 14001:2015 — Requisitos para sistemas de gestão ambiental.",
    ISO14001_REQUIREMENTS
  );
  await seedStandard(
    "ISO 45001",
    "Sistemas de gestão de saúde e segurança ocupacional — Requisitos",
    "ISO 45001:2018 — Requisitos para sistemas de gestão de SSO.",
    ISO45001_REQUIREMENTS
  );
  await seedStandard(
    "ISO 27001",
    "Sistemas de gestão de segurança da informação — Requisitos",
    "ISO/IEC 27001:2022 — Requisitos para sistemas de gestão de segurança da informação.",
    ISO27001_REQUIREMENTS
  );
  await seedStandard(
    "ISO 37001",
    "Sistemas de gestão antissuborno — Requisitos",
    "ISO 37001:2016 — Requisitos para sistemas de gestão antissuborno.",
    ISO37001_REQUIREMENTS
  );
  await seedStandard(
    "ISO 37301",
    "Sistemas de gestão de compliance — Requisitos",
    "ISO 37301:2021 — Requisitos para sistemas de gestão de compliance.",
    ISO37301_REQUIREMENTS
  );

  // 3) Templates documentais
  for (const tpl of DOCUMENT_TEMPLATES) {
    const existing = await prisma.documentTemplate.findFirst({
      where: { name: tpl.name },
    });
    const data = {
      name: tpl.name,
      documentType: tpl.documentType,
      applicableStandards: JSON.stringify(tpl.applicableStandards),
      applicableRequirementCodes: JSON.stringify(tpl.applicableRequirementCodes),
      description: tpl.description,
      defaultStructure: JSON.stringify(tpl.defaultStructure),
      contentTemplate: tpl.contentTemplate,
      isActive: true,
    };
    if (existing) {
      await prisma.documentTemplate.update({ where: { id: existing.id }, data });
    } else {
      await prisma.documentTemplate.create({ data });
    }
  }
  console.log(`📄 ${DOCUMENT_TEMPLATES.length} templates documentais`);

  console.log("🌱 Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
