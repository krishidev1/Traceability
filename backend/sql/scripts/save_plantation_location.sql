BEGIN;

ALTER TABLE public.plantations
  ADD COLUMN IF NOT EXISTS location_description text;

ALTER TABLE public.farms
  ADD COLUMN IF NOT EXISTS farm_location text;

UPDATE public.plantations AS p
SET location_description = f.farm_location
FROM public.farms AS f
WHERE p.farm_id = f.farm_id
  AND NULLIF(BTRIM(p.location_description), '') IS NULL
  AND NULLIF(BTRIM(f.farm_location), '') IS NOT NULL;

WITH latest_plantation_location AS (
  SELECT DISTINCT ON (farm_id)
    farm_id,
    location_description
  FROM public.plantations
  WHERE NULLIF(BTRIM(location_description), '') IS NOT NULL
  ORDER BY farm_id, created_at DESC NULLS LAST, id DESC
)
UPDATE public.farms AS f
SET farm_location = l.location_description
FROM latest_plantation_location AS l
WHERE f.farm_id = l.farm_id
  AND f.farm_location IS DISTINCT FROM l.location_description;

COMMIT;
