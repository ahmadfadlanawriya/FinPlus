-- Allow 'investment' as an account type.
-- The original table may have a CHECK constraint that only allowed
-- credit/debit/qris/e-wallet/cash; inserting type='investment' would
-- fail the entire upsert batch, silently losing newly added accounts.

-- Drop the old constraint (name Supabase/Postgres assigns by default).
-- IF NOT EXISTS guards against already-dropped or never-existed constraints.
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_type_check;

-- Recreate with the full allowed set.
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_type_check
  CHECK (type IN ('credit', 'debit', 'qris', 'e-wallet', 'cash', 'investment'));
