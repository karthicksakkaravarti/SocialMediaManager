-- CreateTable
CREATE TABLE "VideoScript" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scriptJson" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3),
    "videoUrl" TEXT,
    "videoPath" TEXT,
    "duration" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoJob" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentScene" INTEGER,
    "totalScenes" INTEGER,
    "videoUrl" TEXT,
    "videoPath" TEXT,
    "duration" DOUBLE PRECISION,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoPublish" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "youtubeVideoId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoPublish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishConfig" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "autoPublish" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoScript_brandId_status_idx" ON "VideoScript"("brandId", "status");

-- CreateIndex
CREATE INDEX "VideoScript_scheduledAt_idx" ON "VideoScript"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "VideoJob_jobId_key" ON "VideoJob"("jobId");

-- CreateIndex
CREATE INDEX "VideoJob_jobId_idx" ON "VideoJob"("jobId");

-- CreateIndex
CREATE INDEX "VideoJob_status_idx" ON "VideoJob"("status");

-- CreateIndex
CREATE INDEX "VideoPublish_status_idx" ON "VideoPublish"("status");

-- CreateIndex
CREATE UNIQUE INDEX "VideoPublish_scriptId_socialAccountId_key" ON "VideoPublish"("scriptId", "socialAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "PublishConfig_brandId_key" ON "PublishConfig"("brandId");

-- AddForeignKey
ALTER TABLE "VideoScript" ADD CONSTRAINT "VideoScript_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoJob" ADD CONSTRAINT "VideoJob_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "VideoScript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPublish" ADD CONSTRAINT "VideoPublish_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "VideoScript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPublish" ADD CONSTRAINT "VideoPublish_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishConfig" ADD CONSTRAINT "PublishConfig_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
