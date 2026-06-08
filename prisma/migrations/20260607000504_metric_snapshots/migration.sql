-- CreateTable
CREATE TABLE "MetricSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "clients" INTEGER NOT NULL,
    "activeProjects" INTEGER NOT NULL,
    "pendingReqs" INTEGER NOT NULL,
    "overdueActions" INTEGER NOT NULL,
    "avgProgress" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MetricSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MetricSnapshot_organizationId_idx" ON "MetricSnapshot"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricSnapshot_organizationId_date_key" ON "MetricSnapshot"("organizationId", "date");
