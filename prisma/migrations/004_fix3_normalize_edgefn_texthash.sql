-- =============================================================
-- FIX 3 — Normalization + textHash columns
-- =============================================================
-- This migration adds:
--  - nullable normalized_* columns (so future pipelines can be incremental)
--  - nullable unique text_hash columns for exact dedup via SHA-256
--
-- PostgreSQL column naming convention:
--  Prisma textHash      -> text_hash
--  Prisma normalizedText -> normalized_text
-- =============================================================

-- Enable pgcrypto for SHA256/digest functions if you want backfills later.
-- (Edge Function computes hashes at runtime; this is optional for now.)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Parallel sentences
ALTER TABLE "parallel_sentences"
  ALTER COLUMN "normalized_text" DROP NOT NULL;

ALTER TABLE "parallel_sentences"
  ADD COLUMN IF NOT EXISTS "text_hash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "parallel_sentences_text_hash_key"
  ON "parallel_sentences" ("text_hash")
  WHERE "text_hash" IS NOT NULL;

-- Monolingual texts
ALTER TABLE "monolingual_texts"
  ALTER COLUMN "normalized_text" DROP NOT NULL;

ALTER TABLE "monolingual_texts"
  ADD COLUMN IF NOT EXISTS "text_hash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "monolingual_texts_text_hash_key"
  ON "monolingual_texts" ("text_hash")
  WHERE "text_hash" IS NOT NULL;

-- Text segments
ALTER TABLE "text_segments"
  ALTER COLUMN "normalized_text" DROP NOT NULL;

ALTER TABLE "text_segments"
  ADD COLUMN IF NOT EXISTS "text_hash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "text_segments_text_hash_key"
  ON "text_segments" ("text_hash")
  WHERE "text_hash" IS NOT NULL;

-- Proverbs
ALTER TABLE "proverbs"
  ALTER COLUMN "normalized_text" DROP NOT NULL;

ALTER TABLE "proverbs"
  ADD COLUMN IF NOT EXISTS "text_hash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "proverbs_text_hash_key"
  ON "proverbs" ("text_hash")
  WHERE "text_hash" IS NOT NULL;

-- Dialogue turns
ALTER TABLE "dialogue_turns"
  ALTER COLUMN "normalized_text" DROP NOT NULL;

ALTER TABLE "dialogue_turns"
  ADD COLUMN IF NOT EXISTS "text_hash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "dialogue_turns_text_hash_key"
  ON "dialogue_turns" ("text_hash")
  WHERE "text_hash" IS NOT NULL;

-- FAQ
ALTER TABLE "faq_entries"
  ALTER COLUMN "normalized_question" DROP NOT NULL;

ALTER TABLE "faq_entries"
  ADD COLUMN IF NOT EXISTS "text_hash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "faq_entries_text_hash_key"
  ON "faq_entries" ("text_hash")
  WHERE "text_hash" IS NOT NULL;

