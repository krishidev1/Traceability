BEGIN;

-- Existing databases may already have plantations_production_type_check from
-- 001_initial_schema.sql. Replace it explicitly so Kancheepuram Silk can be
-- registered without changing or deleting existing production units.
ALTER TABLE public.plantations
  DROP CONSTRAINT IF EXISTS plantations_production_type_check;

ALTER TABLE public.plantations
  ADD CONSTRAINT plantations_production_type_check
  CHECK (production_type IN (
    'bee',
    'kotpad_handloom',
    'kancheepuram_silk',
    'shrimp',
    'fish',
    'sambalpuri_bandha',
    'vermicompost',
    'pesticides'
  ));

-- Keep the typed detail table available when this fix is applied independently
-- of 003_production_detail_tables.sql.
CREATE TABLE IF NOT EXISTS public.kancheepuram_silk_details (
  id serial PRIMARY KEY,
  crop_id integer NOT NULL UNIQUE REFERENCES public.crops(id) ON DELETE CASCADE,
  plantation_id integer NOT NULL REFERENCES public.plantations(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kancheepuram_details_plantation
  ON public.kancheepuram_silk_details(plantation_id);

COMMIT;
