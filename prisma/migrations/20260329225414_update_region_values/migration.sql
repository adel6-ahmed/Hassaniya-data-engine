-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION');

-- CreateEnum
CREATE TYPE "CurationStage" AS ENUM ('RAW', 'REVIEWED', 'NORMALIZED', 'EXPORT_READY');

-- CreateEnum
CREATE TYPE "Domain" AS ENUM ('GENERAL', 'TELECOM', 'BANKING', 'ECOMMERCE', 'LOGISTICS', 'PUBLIC_SERVICES', 'EDUCATION', 'HEALTHCARE');

-- CreateEnum
CREATE TYPE "Intent" AS ENUM ('GREETING', 'BILLING_ISSUE', 'NETWORK_ISSUE', 'ACCOUNT_HELP', 'PASSWORD_RESET', 'BRANCH_LOCATION', 'PACKAGE_INFO', 'COMPLAINT', 'FAQ_REQUEST', 'OTHER');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('NOUAKCHOTT', 'NOUADHIBOU', 'ROSSO', 'KIFFA', 'KAEDI', 'ZOUERATE', 'ATAR', 'TIDJIKJA', 'NEMA', 'AIOUN', 'OTHER');

-- CreateEnum
CREATE TYPE "EmotionalTone" AS ENUM ('NEUTRAL', 'POSITIVE', 'NEGATIVE', 'FORMAL', 'INFORMAL', 'HUMOROUS');

-- CreateEnum
CREATE TYPE "StyleType" AS ENUM ('COLLOQUIAL', 'FORMAL', 'POETIC', 'NARRATIVE', 'INSTRUCTIONAL');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('ORIGINAL', 'TRANSCRIBED', 'COLLECTED', 'GENERATED', 'CROWDSOURCED');

-- CreateEnum
CREATE TYPE "ProverbCategory" AS ENUM ('PROVERB', 'IDIOM', 'EXPRESSION', 'SAYING');

-- CreateEnum
CREATE TYPE "SpeakerRole" AS ENUM ('CUSTOMER', 'AGENT', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "DialogueStage" AS ENUM ('OPENING', 'CLARIFICATION', 'RESOLUTION', 'ESCALATION', 'CLOSING');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'REVIEWER', 'CONTRIBUTOR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "passwordHash" TEXT,
    "bio" TEXT,
    "region" "Region",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "variation_groups" (
    "id" TEXT NOT NULL,
    "meaningArabic" TEXT NOT NULL,
    "meaningFrench" TEXT,
    "domain" "Domain" NOT NULL DEFAULT 'GENERAL',
    "intent" "Intent" NOT NULL DEFAULT 'OTHER',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variation_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parallel_sentences" (
    "id" TEXT NOT NULL,
    "hassaniyaSentence" TEXT NOT NULL,
    "msaTranslation" TEXT,
    "frenchTranslation" TEXT,
    "rawText" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "category" TEXT,
    "domain" "Domain" NOT NULL DEFAULT 'GENERAL',
    "intent" "Intent" NOT NULL DEFAULT 'OTHER',
    "region" "Region" NOT NULL DEFAULT 'OTHER',
    "emotionalTone" "EmotionalTone" NOT NULL DEFAULT 'NEUTRAL',
    "styleType" "StyleType" NOT NULL DEFAULT 'COLLOQUIAL',
    "confidenceLevel" INTEGER NOT NULL DEFAULT 3,
    "contributorNotes" TEXT,
    "verifiedByNativeSpeaker" BOOLEAN NOT NULL DEFAULT false,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "duplicateOfId" TEXT,
    "curationStage" "CurationStage" NOT NULL DEFAULT 'RAW',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "isExportReady" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contributorId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "variationGroupId" TEXT,

    CONSTRAINT "parallel_sentences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monolingual_texts" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "hassaniyaText" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "topic" TEXT,
    "textType" TEXT,
    "domain" "Domain" NOT NULL DEFAULT 'GENERAL',
    "region" "Region" NOT NULL DEFAULT 'OTHER',
    "emotionalTone" "EmotionalTone" NOT NULL DEFAULT 'NEUTRAL',
    "writingStyle" "StyleType" NOT NULL DEFAULT 'COLLOQUIAL',
    "sourceType" "SourceType" NOT NULL DEFAULT 'ORIGINAL',
    "sourceUrl" TEXT,
    "sourcePlatform" TEXT,
    "containsPersonalInfo" BOOLEAN NOT NULL DEFAULT false,
    "needsManualPrivacyReview" BOOLEAN NOT NULL DEFAULT false,
    "confidenceLevel" INTEGER NOT NULL DEFAULT 3,
    "wordCount" INTEGER,
    "characterCount" INTEGER,
    "curationStage" "CurationStage" NOT NULL DEFAULT 'RAW',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "isExportReady" BOOLEAN NOT NULL DEFAULT false,
    "isSegmented" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contributorId" TEXT NOT NULL,
    "reviewerId" TEXT,

    CONSTRAINT "monolingual_texts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "text_segments" (
    "id" TEXT NOT NULL,
    "textId" TEXT NOT NULL,
    "segmentIndex" INTEGER NOT NULL,
    "segmentText" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "text_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proverbs" (
    "id" TEXT NOT NULL,
    "proverbText" TEXT NOT NULL,
    "meaningExplanation" TEXT NOT NULL,
    "literalTranslation" TEXT,
    "frenchTranslation" TEXT,
    "usageContext" TEXT,
    "rawText" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "category" "ProverbCategory" NOT NULL DEFAULT 'PROVERB',
    "domain" "Domain" NOT NULL DEFAULT 'GENERAL',
    "region" "Region" NOT NULL DEFAULT 'OTHER',
    "confidenceLevel" INTEGER NOT NULL DEFAULT 3,
    "verifiedByNativeSpeaker" BOOLEAN NOT NULL DEFAULT false,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "curationStage" "CurationStage" NOT NULL DEFAULT 'RAW',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "isExportReady" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contributorId" TEXT NOT NULL,
    "reviewerId" TEXT,

    CONSTRAINT "proverbs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialogues" (
    "id" TEXT NOT NULL,
    "dialogueHash" TEXT NOT NULL,
    "title" TEXT,
    "topic" TEXT,
    "domain" "Domain" NOT NULL DEFAULT 'GENERAL',
    "region" "Region" NOT NULL DEFAULT 'OTHER',
    "curationStage" "CurationStage" NOT NULL DEFAULT 'RAW',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "isExportReady" BOOLEAN NOT NULL DEFAULT false,
    "turnCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dialogues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialogue_turns" (
    "id" TEXT NOT NULL,
    "dialogueId" TEXT NOT NULL,
    "turnIndex" INTEGER NOT NULL,
    "utteranceText" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "textHash" TEXT NOT NULL,
    "speakerRole" "SpeakerRole" NOT NULL DEFAULT 'CUSTOMER',
    "dialogueStage" "DialogueStage" NOT NULL DEFAULT 'OPENING',
    "intent" "Intent" NOT NULL DEFAULT 'OTHER',
    "domain" "Domain" NOT NULL DEFAULT 'GENERAL',
    "topic" TEXT,
    "region" "Region" NOT NULL DEFAULT 'OTHER',
    "emotionalTone" "EmotionalTone" NOT NULL DEFAULT 'NEUTRAL',
    "confidenceLevel" INTEGER NOT NULL DEFAULT 3,
    "verifiedByNativeSpeaker" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contributorId" TEXT NOT NULL,
    "variationGroupId" TEXT,

    CONSTRAINT "dialogue_turns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_entries" (
    "id" TEXT NOT NULL,
    "questionHassaniya" TEXT NOT NULL,
    "questionMsa" TEXT,
    "answerHassaniya" TEXT NOT NULL,
    "answerMsa" TEXT,
    "answerFrench" TEXT,
    "rawQuestion" TEXT NOT NULL,
    "normalizedQuestion" TEXT NOT NULL,
    "domain" "Domain" NOT NULL DEFAULT 'GENERAL',
    "intent" "Intent" NOT NULL DEFAULT 'FAQ_REQUEST',
    "sourceType" "SourceType" NOT NULL DEFAULT 'ORIGINAL',
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "curationStage" "CurationStage" NOT NULL DEFAULT 'RAW',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "isExportReady" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contributorId" TEXT NOT NULL,
    "reviewerId" TEXT,

    CONSTRAINT "faq_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duplicate_flags" (
    "id" TEXT NOT NULL,
    "sourceTable" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "duplicateOfId" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "isResolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "duplicate_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_logs" (
    "id" TEXT NOT NULL,
    "sourceTable" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributor_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "moduleTarget" TEXT NOT NULL,
    "domain" "Domain" NOT NULL DEFAULT 'GENERAL',
    "intent" "Intent",
    "targetCount" INTEGER NOT NULL DEFAULT 10,
    "dueDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "assigneeId" TEXT,

    CONSTRAINT "contributor_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_submissions" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "contributorId" TEXT NOT NULL,
    "sourceTable" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_exports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "exportType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filters" JSONB,
    "trainRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "valRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "testRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "totalEntries" INTEGER,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dataVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "requestedById" TEXT NOT NULL,

    CONSTRAINT "data_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_stats" (
    "id" TEXT NOT NULL,
    "totalSentences" INTEGER NOT NULL DEFAULT 0,
    "totalTexts" INTEGER NOT NULL DEFAULT 0,
    "totalProverbs" INTEGER NOT NULL DEFAULT 0,
    "totalDialogues" INTEGER NOT NULL DEFAULT 0,
    "totalFaqEntries" INTEGER NOT NULL DEFAULT 0,
    "totalDuplicateFlags" INTEGER NOT NULL DEFAULT 0,
    "totalExportReady" INTEGER NOT NULL DEFAULT 0,
    "totalPendingReview" INTEGER NOT NULL DEFAULT 0,
    "rawCount" INTEGER NOT NULL DEFAULT 0,
    "reviewedCount" INTEGER NOT NULL DEFAULT 0,
    "normalizedCount" INTEGER NOT NULL DEFAULT 0,
    "exportReadyCount" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "parallel_sentences_normalizedText_idx" ON "parallel_sentences"("normalizedText");

-- CreateIndex
CREATE INDEX "parallel_sentences_domain_intent_idx" ON "parallel_sentences"("domain", "intent");

-- CreateIndex
CREATE INDEX "parallel_sentences_reviewStatus_curationStage_idx" ON "parallel_sentences"("reviewStatus", "curationStage");

-- CreateIndex
CREATE INDEX "parallel_sentences_isExportReady_idx" ON "parallel_sentences"("isExportReady");

-- CreateIndex
CREATE INDEX "parallel_sentences_variationGroupId_idx" ON "parallel_sentences"("variationGroupId");

-- CreateIndex
CREATE INDEX "monolingual_texts_domain_idx" ON "monolingual_texts"("domain");

-- CreateIndex
CREATE INDEX "monolingual_texts_reviewStatus_curationStage_idx" ON "monolingual_texts"("reviewStatus", "curationStage");

-- CreateIndex
CREATE INDEX "monolingual_texts_isExportReady_idx" ON "monolingual_texts"("isExportReady");

-- CreateIndex
CREATE INDEX "text_segments_textId_idx" ON "text_segments"("textId");

-- CreateIndex
CREATE INDEX "proverbs_category_domain_idx" ON "proverbs"("category", "domain");

-- CreateIndex
CREATE INDEX "proverbs_reviewStatus_curationStage_idx" ON "proverbs"("reviewStatus", "curationStage");

-- CreateIndex
CREATE INDEX "proverbs_normalizedText_idx" ON "proverbs"("normalizedText");

-- CreateIndex
CREATE UNIQUE INDEX "dialogues_dialogueHash_key" ON "dialogues"("dialogueHash");

-- CreateIndex
CREATE INDEX "dialogues_domain_idx" ON "dialogues"("domain");

-- CreateIndex
CREATE INDEX "dialogues_reviewStatus_curationStage_idx" ON "dialogues"("reviewStatus", "curationStage");

-- CreateIndex
CREATE INDEX "dialogue_turns_dialogueId_turnIndex_idx" ON "dialogue_turns"("dialogueId", "turnIndex");

-- CreateIndex
CREATE INDEX "dialogue_turns_domain_intent_idx" ON "dialogue_turns"("domain", "intent");

-- CreateIndex
CREATE INDEX "faq_entries_domain_intent_idx" ON "faq_entries"("domain", "intent");

-- CreateIndex
CREATE INDEX "faq_entries_reviewStatus_curationStage_idx" ON "faq_entries"("reviewStatus", "curationStage");

-- CreateIndex
CREATE INDEX "faq_entries_isActive_isExportReady_idx" ON "faq_entries"("isActive", "isExportReady");

-- CreateIndex
CREATE INDEX "duplicate_flags_sourceTable_sourceId_idx" ON "duplicate_flags"("sourceTable", "sourceId");

-- CreateIndex
CREATE INDEX "quality_logs_sourceTable_sourceId_idx" ON "quality_logs"("sourceTable", "sourceId");

-- CreateIndex
CREATE INDEX "contributor_tasks_status_idx" ON "contributor_tasks"("status");

-- CreateIndex
CREATE INDEX "contributor_tasks_assigneeId_idx" ON "contributor_tasks"("assigneeId");

-- CreateIndex
CREATE UNIQUE INDEX "task_submissions_taskId_contributorId_sourceId_key" ON "task_submissions"("taskId", "contributorId", "sourceId");

-- CreateIndex
CREATE INDEX "data_exports_status_idx" ON "data_exports"("status");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variation_groups" ADD CONSTRAINT "variation_groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parallel_sentences" ADD CONSTRAINT "parallel_sentences_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parallel_sentences" ADD CONSTRAINT "parallel_sentences_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "parallel_sentences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parallel_sentences" ADD CONSTRAINT "parallel_sentences_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parallel_sentences" ADD CONSTRAINT "parallel_sentences_variationGroupId_fkey" FOREIGN KEY ("variationGroupId") REFERENCES "variation_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monolingual_texts" ADD CONSTRAINT "monolingual_texts_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monolingual_texts" ADD CONSTRAINT "monolingual_texts_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "text_segments" ADD CONSTRAINT "text_segments_textId_fkey" FOREIGN KEY ("textId") REFERENCES "monolingual_texts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proverbs" ADD CONSTRAINT "proverbs_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proverbs" ADD CONSTRAINT "proverbs_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialogue_turns" ADD CONSTRAINT "dialogue_turns_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialogue_turns" ADD CONSTRAINT "dialogue_turns_dialogueId_fkey" FOREIGN KEY ("dialogueId") REFERENCES "dialogues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialogue_turns" ADD CONSTRAINT "dialogue_turns_variationGroupId_fkey" FOREIGN KEY ("variationGroupId") REFERENCES "variation_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_entries" ADD CONSTRAINT "faq_entries_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_entries" ADD CONSTRAINT "faq_entries_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_tasks" ADD CONSTRAINT "contributor_tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributor_tasks" ADD CONSTRAINT "contributor_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "contributor_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_exports" ADD CONSTRAINT "data_exports_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
