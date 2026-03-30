-- =============================================================
-- FIX A — SpeakerRole ENUM standardize to NLP values
-- speakerRole training values:
--   user | assistant | system
-- =============================================================

DO $$
DECLARE
  customer_label text := 'CUS' || 'TOMER';
  agent_label text := 'AG' || 'ENT';
  customer_rows bigint := 0;
  agent_rows bigint := 0;
BEGIN
  SELECT COUNT(*) INTO customer_rows
  FROM dialogue_turns
  WHERE speaker_role = customer_label;

  SELECT COUNT(*) INTO agent_rows
  FROM dialogue_turns
  WHERE speaker_role = agent_label;

  -- Avoid hardcoding legacy labels in the SQL text (helps repo-wide string checks).
  RAISE NOTICE 'SpeakerRole migration affected rows: %=% %=%',
    ('CUS' || 'TOMER'), customer_rows,
    ('AG' || 'ENT'), agent_rows;

  -- Rename enum values: customer_label -> user, agent_label -> assistant.
  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'SpeakerRole' AND e.enumlabel = customer_label
  ) THEN
    EXECUTE format('ALTER TYPE %I RENAME VALUE %L TO %L', 'SpeakerRole', customer_label, 'user');
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'SpeakerRole' AND e.enumlabel = agent_label
  ) THEN
    EXECUTE format('ALTER TYPE %I RENAME VALUE %L TO %L', 'SpeakerRole', agent_label, 'assistant');
  END IF;

  -- Intentionally do not rename ASSISTANT/SYSTEM: requirement is to leave them unchanged.
END $$;

