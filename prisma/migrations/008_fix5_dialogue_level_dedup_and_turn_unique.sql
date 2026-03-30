-- =============================================================
-- FIX 5 — Dialogue validation + Dialogue-level dedup
-- =============================================================

-- Dialogue table is mapped to "dialogues" via Prisma @@map.

-- -------------------------------------------------------------
-- Add dialogue_hash + dedup fields (Fix 5 extension)
-- -------------------------------------------------------------
ALTER TABLE "dialogues"
  ADD COLUMN IF NOT EXISTS "dialogue_hash" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "dialogues_dialogue_hash_key"
  ON "dialogues" ("dialogue_hash");

ALTER TABLE "dialogues"
  ADD COLUMN IF NOT EXISTS "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "duplicate_of_id" TEXT,
  ADD COLUMN IF NOT EXISTS "similarity_score" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "deduplicated_at" TIMESTAMPTZ;

-- -------------------------------------------------------------
-- Enforce turn_index uniqueness within a dialogue
-- (Fix 5 base requirement)
-- -------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'dialogue_turns_dialogue_id_turn_index_key'
  ) THEN
    ALTER TABLE "dialogue_turns"
      ADD CONSTRAINT dialogue_turns_dialogue_id_turn_index_key
      UNIQUE ("dialogue_id", "turn_index");
  END IF;
END $$;

