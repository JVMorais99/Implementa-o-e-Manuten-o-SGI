-- CreateTable
CREATE TABLE "MembershipClient" (
    "membershipId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("membershipId", "clientId"),
    CONSTRAINT "MembershipClient_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MembershipClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MembershipClient_clientId_idx" ON "MembershipClient"("clientId");

-- Backfill: migra o vínculo legado (Membership.clientId) para a nova tabela.
INSERT INTO "MembershipClient" ("membershipId", "clientId", "createdAt")
SELECT "id", "clientId", CURRENT_TIMESTAMP
FROM "Membership"
WHERE "clientId" IS NOT NULL;
