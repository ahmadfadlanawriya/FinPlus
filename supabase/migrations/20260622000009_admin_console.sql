-- ============================================================
-- Admin Console migration
-- Run manually in Supabase SQL Editor — do NOT run via CLI
-- ============================================================

-- Step 1: columns from the spec
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status       text        DEFAULT 'pending';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_at  timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_by  uuid        REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Add email so admin console can display user emails without joining auth.users
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email        text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name text;

-- Existing users (including admin) auto-approved
UPDATE profiles
SET status = 'approved', approved_at = now()
WHERE status IS NULL OR status = 'pending';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_status       ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);

-- ============================================================
-- Admin bypass: SECURITY DEFINER helper to avoid recursive RLS
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- Admin read-all policies (permissive — OR'd with existing owner policy)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_profiles'     AND tablename = 'profiles')     THEN CREATE POLICY admin_read_all_profiles     ON profiles     FOR SELECT USING (is_admin()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_update_profiles'        AND tablename = 'profiles')     THEN CREATE POLICY admin_update_profiles        ON profiles     FOR UPDATE USING (is_admin()) WITH CHECK (is_admin()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_transactions'  AND tablename = 'transactions') THEN CREATE POLICY admin_read_all_transactions  ON transactions FOR SELECT USING (is_admin()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_accounts'      AND tablename = 'accounts')     THEN CREATE POLICY admin_read_all_accounts      ON accounts     FOR SELECT USING (is_admin()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_goals'         AND tablename = 'goals')        THEN CREATE POLICY admin_read_all_goals         ON goals        FOR SELECT USING (is_admin()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_subscriptions' AND tablename = 'subscriptions')THEN CREATE POLICY admin_read_all_subscriptions ON subscriptions FOR SELECT USING (is_admin()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_parties'       AND tablename = 'parties')      THEN CREATE POLICY admin_read_all_parties       ON parties      FOR SELECT USING (is_admin()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_memory'        AND tablename = 'memory')       THEN CREATE POLICY admin_read_all_memory        ON memory       FOR SELECT USING (is_admin()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_trip_meta'     AND tablename = 'trip_meta')    THEN CREATE POLICY admin_read_all_trip_meta     ON trip_meta    FOR SELECT USING (is_admin()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_statements'    AND tablename = 'statements')   THEN CREATE POLICY admin_read_all_statements    ON statements   FOR SELECT USING (is_admin()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_bal_hist'      AND tablename = 'balance_history') THEN CREATE POLICY admin_read_all_bal_hist   ON balance_history FOR SELECT USING (is_admin()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_import_hist'   AND tablename = 'import_history')  THEN CREATE POLICY admin_read_all_import_hist ON import_history FOR SELECT USING (is_admin()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_loans'         AND tablename = 'loans')        THEN CREATE POLICY admin_read_all_loans         ON loans        FOR SELECT USING (is_admin()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_read_all_loan_payments' AND tablename = 'loan_payments') THEN CREATE POLICY admin_read_all_loan_payments ON loan_payments FOR SELECT USING (is_admin()); END IF;
END $$;
