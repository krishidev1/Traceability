BEGIN;

ALTER TABLE public.plantations DROP CONSTRAINT IF EXISTS plantations_production_type_check;
ALTER TABLE public.plantations ADD CONSTRAINT plantations_production_type_check
  CHECK (production_type IN (
    'bee', 'kotpad_handloom', 'kancheepuram_silk', 'shrimp', 'fish',
    'sambalpuri_bandha', 'vermicompost', 'pesticides', 'mobile_refurbishable'
  ));

CREATE TABLE IF NOT EXISTS public.mobile_refurbishable_details (
  id serial PRIMARY KEY,
  crop_id integer NOT NULL UNIQUE REFERENCES public.crops(id) ON DELETE CASCADE,
  plantation_id integer NOT NULL REFERENCES public.plantations(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mobile_refurbishable_details_plantation
  ON public.mobile_refurbishable_details(plantation_id);

COMMIT;
