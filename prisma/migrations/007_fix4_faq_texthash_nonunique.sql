-- =============================================================
-- FIX 4 (Correction) — FAQ textHash non-unique
-- =============================================================
-- Future-safe requirement:
-- Allow future extension to dedup scopes like (question + domain)
-- and (question + validity window).
--
-- Therefore, we remove the global unique constraint on faq_entries.text_hash.
-- Current dedup behavior is enforced in application logic (code),
-- not by a DB unique index.
-- =============================================================

DROP INDEX IF EXISTS "faq_entries_text_hash_key";

