-- =============================================================
-- FIX 4 — Deduplication system (exact + near-duplicate)
-- =============================================================
-- Adds deduplication metadata fields to all text models.
-- Also removes global uniqueness for dialogue turn `text_hash`
-- because repeated conversational turns are legitimate across
-- many dialogues (non-blocking dedup for dialogue turns).
-- =============================================================

-- -------------------------------------------------------------
-- Drop unique index on dialogue_turns.text_hash (Fix 4 dialogue caution)
-- (created in 004_fix3_normalize_edgefn_texthash.sql)
-- -------------------------------------------------------------
DROP INDEX IF EXISTS "dialogue_turns_text_hash_key";

-- -------------------------------------------------------------
-- Parallel sentences: add similarity_score + deduplicated_at
-- Table: parallel_sentences
-- -------------------------------------------------------------
ALTER TABLE "parallel_sentences"
  ADD COLUMN IF NOT EXISTS "similarity_score" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "deduplicated_at" TIMESTAMPTZ;

-- -------------------------------------------------------------
-- Monolingual texts: add dedup fields
-- Table: monolingual_texts
-- -------------------------------------------------------------
ALTER TABLE "monolingual_texts"
  ADD COLUMN IF NOT EXISTS "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "duplicate_of_id" TEXT,
  ADD COLUMN IF NOT EXISTS "similarity_score" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "deduplicated_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_monolingual_texts_is_duplicate
  ON "monolingual_texts" ("is_duplicate");

-- -------------------------------------------------------------
-- Proverbs: add missing dedup fields
-- Table: proverbs
-- -------------------------------------------------------------
ALTER TABLE "proverbs"
  ADD COLUMN IF NOT EXISTS "duplicate_of_id" TEXT,
  ADD COLUMN IF NOT EXISTS "similarity_score" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "deduplicated_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_proverbs_is_duplicate
  ON "proverbs" ("is_duplicate");

-- -------------------------------------------------------------
-- Dialogue turns: add dedup fields
-- Table: dialogue_turns
-- -------------------------------------------------------------
ALTER TABLE "dialogue_turns"
  ADD COLUMN IF NOT EXISTS "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "duplicate_of_id" TEXT,
  ADD COLUMN IF NOT EXISTS "similarity_score" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "deduplicated_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_dialogue_turns_is_duplicate
  ON "dialogue_turns" ("is_duplicate");

-- -------------------------------------------------------------
-- FAQ entries: add dedup fields
-- Table: faq_entries
-- -------------------------------------------------------------
ALTER TABLE "faq_entries"
  ADD COLUMN IF NOT EXISTS "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "duplicate_of_id" TEXT,
  ADD COLUMN IF NOT EXISTS "similarity_score" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "deduplicated_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_faq_entries_is_duplicate
  ON "faq_entries" ("is_duplicate");

