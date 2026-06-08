-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CONSULTOR',
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "clients" INTEGER NOT NULL,
    "activeProjects" INTEGER NOT NULL,
    "pendingReqs" INTEGER NOT NULL,
    "overdueActions" INTEGER NOT NULL,
    "avgProgress" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CONSULTOR',
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipClient" (
    "membershipId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipClient_pkey" PRIMARY KEY ("membershipId","clientId")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "unit" TEXT,
    "responsible" TEXT,
    "contact" TEXT,
    "segment" TEXT,
    "scope" TEXT,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IsoStandard" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "IsoStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IsoRequirement" (
    "id" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "consultantGuidance" TEXT NOT NULL,
    "suggestedQuestion" TEXT NOT NULL,
    "expectedEvidence" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "IsoRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IsoProject" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "responsible" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EM_ANDAMENTO',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IsoProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStandard" (
    "projectId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,

    CONSTRAINT "ProjectStandard_pkey" PRIMARY KEY ("projectId","standardId")
);

-- CreateTable
CREATE TABLE "ProjectRequirement" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NAO_INICIADO',
    "consultantNotes" TEXT,
    "clientNotes" TEXT,
    "responsible" TEXT,
    "dueDate" TIMESTAMP(3),
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "aiSuggestedStatus" TEXT,
    "aiRationale" TEXT,
    "aiEvaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "projectRequirementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'RECEBIDA',
    "technicalAnalysis" TEXT,
    "aiAnalysis" TEXT,
    "aiSuggestedStatus" TEXT,
    "aiConfidence" INTEGER,
    "aiEvaluatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "projectRequirementId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "contentJson" TEXT,
    "exportedDocxUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GERADO',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "sentToClientAt" TIMESTAMP(3),
    "signedReceivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "changeNote" TEXT,
    "authorId" TEXT,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "applicableStandards" TEXT NOT NULL,
    "applicableRequirementCodes" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "defaultStructure" TEXT NOT NULL,
    "contentTemplate" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionPlan" (
    "id" TEXT NOT NULL,
    "projectRequirementId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "responsible" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementComment" (
    "id" TEXT NOT NULL,
    "projectRequirementId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequirementComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scope" TEXT,
    "objective" TEXT,
    "criteria" TEXT,
    "leadAuditor" TEXT,
    "auditTeam" TEXT,
    "auditedOrg" TEXT,
    "plannedDate" TIMESTAMP(3),
    "executedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PLANEJADA',
    "conclusion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditItem" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "projectRequirementId" TEXT NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'NAO_AVALIADO',
    "notes" TEXT,
    "evidenceSampled" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditFinding" (
    "id" TEXT NOT NULL,
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
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthToken_email_idx" ON "AuthToken"("email");

-- CreateIndex
CREATE INDEX "AuthToken_type_idx" ON "AuthToken"("type");

-- CreateIndex
CREATE INDEX "MetricSnapshot_organizationId_idx" ON "MetricSnapshot"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricSnapshot_organizationId_date_key" ON "MetricSnapshot"("organizationId", "date");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE INDEX "Membership_clientId_idx" ON "Membership"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_organizationId_userId_key" ON "Membership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "MembershipClient_clientId_idx" ON "MembershipClient"("clientId");

-- CreateIndex
CREATE INDEX "Client_userId_idx" ON "Client"("userId");

-- CreateIndex
CREATE INDEX "Client_organizationId_idx" ON "Client"("organizationId");

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
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_revision_key" ON "DocumentVersion"("documentId", "revision");

-- CreateIndex
CREATE INDEX "ActionPlan_projectRequirementId_idx" ON "ActionPlan"("projectRequirementId");

-- CreateIndex
CREATE INDEX "RequirementComment_projectRequirementId_idx" ON "RequirementComment"("projectRequirementId");

-- CreateIndex
CREATE INDEX "RequirementComment_authorId_idx" ON "RequirementComment"("authorId");

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

-- AddForeignKey
ALTER TABLE "MetricSnapshot" ADD CONSTRAINT "MetricSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipClient" ADD CONSTRAINT "MembershipClient_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipClient" ADD CONSTRAINT "MembershipClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IsoRequirement" ADD CONSTRAINT "IsoRequirement_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "IsoStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IsoProject" ADD CONSTRAINT "IsoProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStandard" ADD CONSTRAINT "ProjectStandard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IsoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStandard" ADD CONSTRAINT "ProjectStandard_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "IsoStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRequirement" ADD CONSTRAINT "ProjectRequirement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IsoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRequirement" ADD CONSTRAINT "ProjectRequirement_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "IsoStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectRequirement" ADD CONSTRAINT "ProjectRequirement_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "IsoRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GeneratedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementComment" ADD CONSTRAINT "RequirementComment_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementComment" ADD CONSTRAINT "RequirementComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "IsoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditItem" ADD CONSTRAINT "AuditItem_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditItem" ADD CONSTRAINT "AuditItem_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
