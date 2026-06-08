-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scope" TEXT,
    "objective" TEXT,
    "criteria" TEXT,
    "leadAuditor" TEXT,
    "auditTeam" TEXT,
    "auditedOrg" TEXT,
    "plannedDate" DATETIME,
    "executedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PLANEJADA',
    "conclusion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Audit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IsoProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "projectRequirementId" TEXT NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'NAO_AVALIADO',
    "notes" TEXT,
    "evidenceSampled" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuditItem_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditItem_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditFinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "projectRequirementId" TEXT,
    "requirementCode" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT,
    "correction" TEXT,
    "rootCause" TEXT,
    "correctiveAction" TEXT,
    "responsible" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuditFinding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditFinding_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Audit_projectId_idx" ON "Audit"("projectId");

-- CreateIndex
CREATE INDEX "AuditItem_auditId_idx" ON "AuditItem"("auditId");

-- CreateIndex
CREATE INDEX "AuditItem_projectRequirementId_idx" ON "AuditItem"("projectRequirementId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditItem_auditId_projectRequirementId_key" ON "AuditItem"("auditId", "projectRequirementId");

-- CreateIndex
CREATE INDEX "AuditFinding_auditId_idx" ON "AuditFinding"("auditId");

-- CreateIndex
CREATE INDEX "AuditFinding_projectRequirementId_idx" ON "AuditFinding"("projectRequirementId");
