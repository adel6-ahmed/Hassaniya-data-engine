-- =============================================================
-- FIX D — dialogueHashVersion field
-- =============================================================

ALTER TABLE "dialogues"
  ADD COLUMN IF NOT EXISTS "dialogue_hash_version" TEXT
  NOT NULL DEFAULT 'v1';

