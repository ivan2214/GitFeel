-- CreateTable
CREATE TABLE "public"."fork_tags" (
    "id" TEXT NOT NULL,
    "forkId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "fork_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fork_tags_tagId_idx" ON "public"."fork_tags"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "fork_tags_forkId_tagId_key" ON "public"."fork_tags"("forkId", "tagId");
