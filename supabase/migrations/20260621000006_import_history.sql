CREATE TABLE public.import_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  file_name    text NOT NULL,
  file_hash    text NOT NULL,
  file_size    bigint NOT NULL DEFAULT 0,
  imported_at  timestamptz NOT NULL DEFAULT now(),
  account_id   uuid,
  account_name text,
  tx_count     integer NOT NULL DEFAULT 0
);

ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner" ON public.import_history FOR ALL USING (user_id = auth.uid());

CREATE INDEX import_history_user_hash ON public.import_history (user_id, file_hash);
