-- Enhancement: Monthly statements table
CREATE TABLE IF NOT EXISTS public.statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  month text NOT NULL,
  statement_date date,
  due_date date,
  total_amount numeric NOT NULL DEFAULT 0,
  min_payment numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own statements" ON public.statements;
CREATE POLICY "own statements" ON public.statements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enhancement: Trip display name
ALTER TABLE public.trip_meta ADD COLUMN IF NOT EXISTS name text;
