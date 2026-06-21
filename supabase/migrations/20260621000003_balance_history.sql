CREATE TABLE public.balance_history (
  user_id     uuid NOT NULL,
  account_id  uuid NOT NULL,
  recorded_at date NOT NULL DEFAULT current_date,
  balance     numeric NOT NULL,
  PRIMARY KEY (user_id, account_id, recorded_at)
);

ALTER TABLE public.balance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner" ON public.balance_history FOR ALL USING (user_id = auth.uid());
