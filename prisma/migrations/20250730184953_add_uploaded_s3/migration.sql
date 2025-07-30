-- CreateTable
CREATE TABLE "public"."UploadedS3" (
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isMainImage" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "size" DOUBLE PRECISION,
    "commitId" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadedS3_key_key" ON "public"."UploadedS3"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UploadedS3_url_key" ON "public"."UploadedS3"("url");

-- CreateIndex
CREATE INDEX "UploadedS3_commitId_idx" ON "public"."UploadedS3"("commitId");
