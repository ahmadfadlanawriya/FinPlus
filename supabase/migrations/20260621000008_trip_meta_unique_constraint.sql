-- Ensure the upsert in syncTableByKey works for trip_meta.
-- The onConflict: "user_id,trip_key" requires a unique constraint.
ALTER TABLE public.trip_meta DROP CONSTRAINT IF EXISTS trip_meta_user_id_trip_key_key;
ALTER TABLE public.trip_meta ADD CONSTRAINT trip_meta_user_id_trip_key_key UNIQUE (user_id, trip_key);
