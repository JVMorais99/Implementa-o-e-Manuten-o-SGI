-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CONSULTOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "unit" TEXT,
    "responsible" TEXT,
    "contact" TEXT,
    "segment" TEXT,
    "scope" TEXT,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IsoStandard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "IsoRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "standardId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "consultantGuidance" TEXT NOT NULL,
    "suggestedQuestion" TEXT NOT NULL,
    "expectedEvidence" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "IsoRequirement_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "IsoStandard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IsoProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" DATETIME,
    "dueDate" DATETIME,
    "responsible" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IsoProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectStandard" (
    "projectId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,

    PRIMARY KEY ("projectId", "standardId"),
    CONSTRAINT "ProjectStandard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IsoProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectStandard_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "IsoStandard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NAO_INICIADO',
    "consultantNotes" TEXT,
    "clientNotes" TEXT,
    "responsible" TEXT,
    "dueDate" DATETIME,
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectRequirement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IsoProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectRequirement_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "IsoStandard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectRequirement_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "IsoRequirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectRequirementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "receivedAt" DATETIME,
    "expiresAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'RECEBIDA',
    "technicalAnalysis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Evidence_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectRequirementId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "contentJson" TEXT,
    "exportedDocxUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GERADO',
    "sentToClientAt" DATETIME,
    "signedReceivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GeneratedDocument_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GeneratedDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "applicableStandards" TEXT NOT NULL,
    "applicableRequirementCodes" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defaultStructure" TEXT NOT NULL,
    "contentTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ActionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectRequirementId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "responsible" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActionPlan_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RequirementComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectRequirementId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequirementComment_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RequirementComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Client_userId_idx" ON "Client"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IsoStandard_code_key" ON "IsoStandard"("code");

-- CreateIndex
CREATE INDEX "IsoRequirement_standardId_idx" ON "IsoRequirement"("standardId");

-- CreateIndex
CREATE UNIQUE INDEX "IsoRequirement_standardId_code_key" ON "IsoRequirement"("standardId", "code");

-- CreateIndex
CREATE INDEX "IsoProject_clientId_idx" ON "IsoProject"("clientId");

-- CreateIndex
CREATE INDEX "ProjectStandard_standardId_idx" ON "ProjectStandard"("standardId");

-- CreateIndex
CREATE INDEX "ProjectRequirement_projectId_idx" ON "ProjectRequirement"("projectId");

-- CreateIndex
CREATE INDEX "ProjectRequirement_requirementId_idx" ON "ProjectRequirement"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRequirement_projectId_requirementId_key" ON "ProjectRequirement"("projectId", "requirementId");

-- CreateIndex
CREATE INDEX "Evidence_projectRequirementId_idx" ON "Evidence"("projectRequirementId");

-- CreateIndex
CREATE INDEX "GeneratedDocument_projectRequirementId_idx" ON "GeneratedDocument"("projectRequirementId");

-- CreateIndex
CREATE INDEX "GeneratedDocument_templateId_idx" ON "GeneratedDocument"("templateId");

-- CreateIndex
CREATE INDEX "ActionPlan_projectRequirementId_idx" ON "ActionPlan"("projectRequirementId");

-- CreateIndex
CREATE INDEX "RequirementComment_projectRequirementId_idx" ON "RequirementComment"("projectRequirementId");

-- CreateIndex
CREATE INDEX "RequirementComment_authorId_idx" ON "RequirementComment"("authorId");
