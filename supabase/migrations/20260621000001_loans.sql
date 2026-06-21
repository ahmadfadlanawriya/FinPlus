CREATE TABLE loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  borrower_id uuid references parties(id) on delete set null,
  borrower_name text not null,
  description text,
  principal numeric not null,
  source_account_id uuid references accounts(id) on delete set null,
  issued_date date not null,
  due_date date,
  status text default 'active',
  notes text,
  created_at timestamptz default now()
);

CREATE TABLE loan_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  loan_id uuid references loans(id) on delete cascade not null,
  amount numeric not null,
  paid_date date not null,
  note text,
  created_at timestamptz default now()
);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own data" ON loans FOR ALL USING (user_id = auth.uid());
CREATE POLICY "own data" ON loan_payments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "admin override" ON loans FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin override" ON loan_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
