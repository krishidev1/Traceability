BEGIN;

ALTER TABLE public.plantations
  ADD COLUMN IF NOT EXISTS production_type character varying(50) DEFAULT 'shrimp';

ALTER TABLE public.plantations
  ALTER COLUMN production_type SET DEFAULT 'shrimp';

UPDATE public.plantations
SET production_type = COALESCE(NULLIF(farms.crop_type, ''), 'shrimp')
FROM public.farms
WHERE public.plantations.farm_id = farms.farm_id
  AND farms.crop_type IN ('shrimp', 'bee', 'kotpad_handloom')
  AND (
    public.plantations.production_type IS NULL
    OR public.plantations.production_type NOT IN ('shrimp', 'bee', 'kotpad_handloom')
    OR public.plantations.production_type = 'shrimp'
  );

UPDATE public.plantations
SET production_type = 'shrimp'
WHERE production_type IS NULL
   OR production_type NOT IN ('shrimp', 'bee', 'kotpad_handloom');

ALTER TABLE public.plantations
  DROP CONSTRAINT IF EXISTS plantations_production_type_check;

ALTER TABLE public.plantations
  ADD CONSTRAINT plantations_production_type_check
  CHECK (production_type IN ('shrimp', 'bee', 'kotpad_handloom'));

COMMIT;
