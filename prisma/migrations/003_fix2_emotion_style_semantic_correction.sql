-- =============================================================
-- FIX 2 — Metadata Enum Correction
-- Correct Hassaniya dataset mix-up:
--  - emotional_tone (should be): NEUTRAL | POSITIVE | NEGATIVE | ANGRY | HAPPY | SAD
--  - style_type (should be): FORMAL | INFORMAL | COLLOQUIAL | NARRATIVE | POETIC
--
-- Notes:
-- 1) Run this after the enum columns have been updated to allow NULL
--    and (for the final default writes) allow the INFORMAL/ANGRY/HAPPY/SAD labels.
-- 2) The script logs affected row counts via RAISE NOTICE.
-- =============================================================

DO $$
DECLARE
  ps_emotional_wrong_count int := 0;
  ps_style_wrong_count int := 0;
  mt_emotional_wrong_count int := 0;
  mt_style_wrong_count int := 0;
BEGIN
  -- ==========================================================
  -- Parallel sentences: parallel_sentences
  -- Columns (Prisma -> Postgres default mapping):
  --   emotionalTone -> emotional_tone
  --   styleType     -> style_type
  -- ==========================================================

  -- If emotional_tone currently contains old style_type values,
  -- set it to NULL (then later default to NEUTRAL).
  SELECT COUNT(*)
    INTO ps_emotional_wrong_count
  FROM parallel_sentences
  WHERE emotional_tone::text IN ('FORMAL', 'INFORMAL', 'COLLOQUIAL', 'NARRATIVE', 'POETIC', 'INSTRUCTIONAL');

  UPDATE parallel_sentences
  SET emotional_tone = NULL
  WHERE emotional_tone::text IN ('FORMAL', 'INFORMAL', 'COLLOQUIAL', 'NARRATIVE', 'POETIC', 'INSTRUCTIONAL');

  -- If style_type currently contains old emotional_tone values,
  -- set it to NULL (then later default to INFORMAL).
  SELECT COUNT(*)
    INTO ps_style_wrong_count
  FROM parallel_sentences
  WHERE style_type::text IN ('NEUTRAL', 'POSITIVE', 'NEGATIVE', 'ANGRY', 'HAPPY', 'SAD', 'HUMOROUS', 'FORMAL', 'INFORMAL');

  UPDATE parallel_sentences
  SET style_type = NULL
  WHERE style_type::text IN ('NEUTRAL', 'POSITIVE', 'NEGATIVE', 'ANGRY', 'HAPPY', 'SAD', 'HUMOROUS', 'FORMAL', 'INFORMAL');

  -- Apply defaults after nullification
  UPDATE parallel_sentences
  SET emotional_tone = 'NEUTRAL'
  WHERE emotional_tone IS NULL;

  UPDATE parallel_sentences
  SET style_type = 'INFORMAL'
  WHERE style_type IS NULL;

  -- ==========================================================
  -- Monolingual texts: monolingual_texts
  -- Columns:
  --   emotionalTone -> emotional_tone
  --   writingStyle  -> writing_style
  -- ==========================================================

  SELECT COUNT(*)
    INTO mt_emotional_wrong_count
  FROM monolingual_texts
  WHERE emotional_tone::text IN ('FORMAL', 'INFORMAL', 'COLLOQUIAL', 'NARRATIVE', 'POETIC', 'INSTRUCTIONAL');

  UPDATE monolingual_texts
  SET emotional_tone = NULL
  WHERE emotional_tone::text IN ('FORMAL', 'INFORMAL', 'COLLOQUIAL', 'NARRATIVE', 'POETIC', 'INSTRUCTIONAL');

  SELECT COUNT(*)
    INTO mt_style_wrong_count
  FROM monolingual_texts
  WHERE writing_style::text IN ('NEUTRAL', 'POSITIVE', 'NEGATIVE', 'ANGRY', 'HAPPY', 'SAD', 'HUMOROUS', 'FORMAL', 'INFORMAL');

  UPDATE monolingual_texts
  SET writing_style = NULL
  WHERE writing_style::text IN ('NEUTRAL', 'POSITIVE', 'NEGATIVE', 'ANGRY', 'HAPPY', 'SAD', 'HUMOROUS', 'FORMAL', 'INFORMAL');

  -- Apply defaults after nullification
  UPDATE monolingual_texts
  SET emotional_tone = 'NEUTRAL'
  WHERE emotional_tone IS NULL;

  UPDATE monolingual_texts
  SET writing_style = 'INFORMAL'
  WHERE writing_style IS NULL;

  RAISE NOTICE 'FIX2 counts: parallel_sentences emotional_tone wrong=% style_type wrong=%', ps_emotional_wrong_count, ps_style_wrong_count;
  RAISE NOTICE 'FIX2 counts: monolingual_texts emotional_tone wrong=% writing_style wrong=%', mt_emotional_wrong_count, mt_style_wrong_count;
END $$;

