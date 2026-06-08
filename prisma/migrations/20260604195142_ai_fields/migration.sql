-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN "aiAnalysis" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "aiConfidence" INTEGER;
ALTER TABLE "Evidence" ADD COLUMN "aiEvaluatedAt" DATETIME;
ALTER TABLE "Evidence" ADD COLUMN "aiSuggestedStatus" TEXT;

-- AlterTable
ALTER TABLE "ProjectRequirement" ADD COLUMN "aiEvaluatedAt" DATETIME;
ALTER TABLE "ProjectRequirement" ADD COLUMN "aiRationale" TEXT;
ALTER TABLE "ProjectRequirement" ADD COLUMN "aiSuggestedStatus" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectRequirementId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "responsible" TEXT,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIA',
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActionPlan_projectRequirementId_fkey" FOREIGN KEY ("projectRequirementId") REFERENCES "ProjectRequirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ActionPlan" ("action", "createdAt", "dueDate", "id", "priority", "projectRequirementId", "responsible", "status", "updatedAt") SELECT "action", "createdAt", "dueDate", "id", "priority", "projectRequirementId", "responsible", "status", "updatedAt" FROM "ActionPlan";
DROP TABLE "ActionPlan";
ALTER TABLE "new_ActionPlan" RENAME TO "ActionPlan";
CREATE INDEX "ActionPlan_projectRequirementId_idx" ON "ActionPlan"("projectRequirementId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
