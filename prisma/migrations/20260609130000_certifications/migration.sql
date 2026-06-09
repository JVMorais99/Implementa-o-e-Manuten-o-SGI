-- CreateTable: certificação ISO de um cliente (fase de manutenção/recertificação)
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "standardId" TEXT NOT NULL,
    "certifyingBody" TEXT,
    "certificateNo" TEXT,
    "scope" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "surveillanceIntervalMonths" INTEGER NOT NULL DEFAULT 12,
    "lastSurveillanceAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Certification_clientId_idx" ON "Certification"("clientId");
CREATE INDEX "Certification_standardId_idx" ON "Certification"("standardId");
CREATE INDEX "Certification_expiresAt_idx" ON "Certification"("expiresAt");

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_standardId_fkey" FOREIGN KEY ("standardId") REFERENCES "IsoStandard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
