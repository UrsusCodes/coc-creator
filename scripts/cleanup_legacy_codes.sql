-- One-shot pre-deploy cleanup of legacy invite codes.
-- Run ONCE, before deploying the code-identity rework (migration 018 + new UI).
--
-- SAFETY:
--   - Only deletes codes with NO linked character row.
--   - Codes linked to any character (draft OR submitted) are preserved.
--     Reason: FK characters.invite_code_id ... ON DELETE CASCADE would destroy
--     the approved character. Per user rule, "zatwierdzone postaci" must be preserved.
--   - Run the SELECT first in a transaction you can ROLLBACK; commit only after review.
--
-- USAGE:
--   BEGIN;
--     -- Step 1: preview
--     \i scripts/cleanup_legacy_codes.sql
--     -- Step 2: review output; if OK:
--   COMMIT;
--   -- else: ROLLBACK;

-- Preview rows that will be deleted.
SELECT
  ic.id,
  ic.code,
  ic.label,
  ic.created_at,
  ic.era,
  ic.methods
FROM invite_codes ic
LEFT JOIN characters c ON c.invite_code_id = ic.id
WHERE c.id IS NULL
ORDER BY ic.created_at DESC;

-- Count summary.
SELECT
  COUNT(*) FILTER (WHERE c.id IS NULL)                            AS unused_to_delete,
  COUNT(*) FILTER (WHERE c.status = 'draft')                      AS linked_draft_kept,
  COUNT(*) FILTER (WHERE c.status = 'submitted')                  AS linked_submitted_kept
FROM invite_codes ic
LEFT JOIN characters c ON c.invite_code_id = ic.id;

-- Actual delete (commented out — uncomment after reviewing the preview above).
-- DELETE FROM invite_codes ic
-- WHERE NOT EXISTS (
--   SELECT 1 FROM characters c WHERE c.invite_code_id = ic.id
-- );
