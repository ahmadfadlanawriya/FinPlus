ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS pinned_trip_key text;
