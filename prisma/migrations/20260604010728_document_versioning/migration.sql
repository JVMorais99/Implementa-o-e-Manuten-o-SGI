-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "changeNote" TEXT,
    "authorId" TEXT,
    "authorName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "GeneratedDocument" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GeneratedDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectRequirementId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "contentJson" TEXT,
    "exportedDocxUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'GERADO',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "sentToClientAt" DATETIME,
    "signedReceivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GeneratedDocument_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GeneratedDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GeneratedDocument" ("contentHtml", "contentJson", "createdAt", "exportedDocxUrl", "id", "projectRequirementId", "sentToClientAt", "signedReceivedAt", "status", "templateId", "title", "updatedAt") SELECT "contentHtml", "contentJson", "createdAt", "exportedDocxUrl", "id", "projectRequirementId", "sentToClientAt", "signedReceivedAt", "status", "templateId", "title", "updatedAt" FROM "GeneratedDocument";
DROP TABLE "GeneratedDocument";
ALTER TABLE "new_GeneratedDocument" RENAME TO "GeneratedDocument";
CREATE INDEX "GeneratedDocument_projectRequirementId_idx" ON "GeneratedDocument"("projectRequirementId");
CREATE INDEX "GeneratedDocument_templateId_idx" ON "GeneratedDocument"("templateId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_revision_key" ON "DocumentVersion"("documentId", "revision");
