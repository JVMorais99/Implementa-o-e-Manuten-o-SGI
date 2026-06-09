-- AlterTable: consultor responsável (do nosso lado) por cliente
ALTER TABLE "Client" ADD COLUMN "responsibleMembershipId" TEXT;

-- AlterTable: consultor responsável pelo projeto (accountability)
ALTER TABLE "IsoProject" ADD COLUMN "responsibleMembershipId" TEXT;

-- CreateTable: trilha de atividades (accountability)
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "clientId" TEXT,
    "projectId" TEXT,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_responsibleMembershipId_idx" ON "Client"("responsibleMembershipId");
CREATE INDEX "IsoProject_responsibleMembershipId_idx" ON "IsoProject"("responsibleMembershipId");
CREATE INDEX "ActivityLog_organizationId_createdAt_idx" ON "ActivityLog"("organizationId", "createdAt");
CREATE INDEX "ActivityLog_actorId_idx" ON "ActivityLog"("actorId");
CREATE INDEX "ActivityLog_clientId_idx" ON "ActivityLog"("clientId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_responsibleMembershipId_fkey" FOREIGN KEY ("responsibleMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IsoProject" ADD CONSTRAINT "IsoProject_responsibleMembershipId_fkey" FOREIGN KEY ("responsibleMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
