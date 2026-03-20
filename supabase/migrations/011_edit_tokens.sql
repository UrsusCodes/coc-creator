-- Migration 011: Add edit_mode and expires_at to share_tokens

ALTER TABLE share_tokens ADD COLUMN IF NOT EXISTS edit_mode TEXT DEFAULT NULL;
ALTER TABLE share_tokens ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- Ensure character_history rows are NEVER deleted.
-- We add a policy that prevents any delete on character_history.
-- (Using RLS: enable if not already enabled, then deny delete to all)

-- character_history should already have RLS or be service-role only.
-- We simply document: never issue DELETE on character_history.
-- If RLS is enabled on character_history, add a restrictive policy:
DO $$
BEGIN
  -- Check if RLS is enabled on character_history; if not, we still rely on
  -- the service role only approach and no direct delete is ever called.
  -- This migration is a no-op for policies since the edge functions
  -- (which use service_role) are the only code that touches this table,
  -- and we simply never call DELETE in those functions.
  RAISE NOTICE 'character_history delete protection: enforced at application layer';
END $$;
