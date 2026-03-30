-- =============================================================
-- HASSANIYA DATASET PLATFORM
-- Initial Migration: 001_init
-- =============================================================

-- Enable UUID extension (optional, we use cuid() from Prisma)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- All tables are created via `prisma migrate dev`
-- Run: npx prisma migrate dev --name init

-- After migration, seed with: npx tsx prisma/seed.ts

-- =============================================================
-- PERFORMANCE INDEXES (additional, beyond Prisma schema)
-- =============================================================

-- Full text search index on Hassaniya content
CREATE INDEX IF NOT EXISTS idx_parallel_sentences_hassaniya_fts
  ON parallel_sentences USING gin(to_tsvector('simple', hassaniya_sentence));

CREATE INDEX IF NOT EXISTS idx_monolingual_text_fts
  ON monolingual_texts USING gin(to_tsvector('simple', hassaniya_text));

CREATE INDEX IF NOT EXISTS idx_proverbs_fts
  ON proverbs USING gin(to_tsvector('simple', proverb_text));

CREATE INDEX IF NOT EXISTS idx_faq_question_fts
  ON faq_entries USING gin(to_tsvector('simple', question_hassaniya));

-- Composite indexes for export queries
CREATE INDEX IF NOT EXISTS idx_sentences_export
  ON parallel_sentences (is_export_ready, curation_stage, domain);

CREATE INDEX IF NOT EXISTS idx_texts_export
  ON monolingual_texts (is_export_ready, curation_stage, domain);

CREATE INDEX IF NOT EXISTS idx_dialogues_export
  ON dialogues (is_export_ready, curation_stage, domain);

-- =============================================================
-- HELPER VIEWS (optional, for analytics)
-- =============================================================

CREATE OR REPLACE VIEW v_dataset_summary AS
SELECT
  'parallel_sentences' AS module,
  COUNT(*) AS total,
  SUM(CASE WHEN review_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
  SUM(CASE WHEN is_export_ready = true THEN 1 ELSE 0 END) AS export_ready,
  SUM(CASE WHEN review_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_review
FROM parallel_sentences

UNION ALL

SELECT
  'monolingual_texts',
  COUNT(*),
  SUM(CASE WHEN review_status = 'APPROVED' THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_export_ready = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN review_status = 'PENDING' THEN 1 ELSE 0 END)
FROM monolingual_texts

UNION ALL

SELECT
  'proverbs',
  COUNT(*),
  SUM(CASE WHEN review_status = 'APPROVED' THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_export_ready = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN review_status = 'PENDING' THEN 1 ELSE 0 END)
FROM proverbs

UNION ALL

SELECT
  'faq_entries',
  COUNT(*),
  SUM(CASE WHEN review_status = 'APPROVED' THEN 1 ELSE 0 END),
  SUM(CASE WHEN is_export_ready = true THEN 1 ELSE 0 END),
  SUM(CASE WHEN review_status = 'PENDING' THEN 1 ELSE 0 END)
FROM faq_entries;
