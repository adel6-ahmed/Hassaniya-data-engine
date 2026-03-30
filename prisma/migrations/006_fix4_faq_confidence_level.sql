-- =============================================================
-- FIX 4 — FAQ confidenceLevel (dedup prioritization)
-- =============================================================

ALTER TABLE "faq_entries"
  ADD COLUMN IF NOT EXISTS "confidence_level" INTEGER NOT NULL DEFAULT 3;

