DO $$ BEGIN
  ALTER TABLE public.memory
    ADD CONSTRAINT memory_user_id_merchant_key_key UNIQUE (user_id, merchant_key);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.trip_meta
    ADD CONSTRAINT trip_meta_user_id_trip_key_key UNIQUE (user_id, trip_key);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
