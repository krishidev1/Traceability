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

ALTER TABLE public.farms
  DROP COLUMN IF EXISTS soil_type,
  DROP COLUMN IF EXISTS irrigation_method,
  DROP COLUMN IF EXISTS is_organic,
  DROP COLUMN IF EXISTS farm_type;

ALTER TABLE public.crops
  DROP COLUMN IF EXISTS seed_source;

ALTER TABLE public.monitoring_records
  DROP COLUMN IF EXISTS fertilizer_usage,
  DROP COLUMN IF EXISTS pesticide_records,
  DROP COLUMN IF EXISTS irrigation_logs,
  DROP COLUMN IF EXISTS disease_detection,
  DROP COLUMN IF EXISTS drone_monitoring;

ALTER TABLE public.packings
  DROP COLUMN IF EXISTS batch_number,
  DROP COLUMN IF EXISTS cold_storage,
  DROP COLUMN IF EXISTS transport_method;

DROP TABLE IF EXISTS public.artisan_profiles;
DROP TABLE IF EXISTS public.women_ngo_profiles;

COMMIT;
