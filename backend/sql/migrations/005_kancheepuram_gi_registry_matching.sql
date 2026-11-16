BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS organisation_name varchar(255),
  ADD COLUMN IF NOT EXISTS profile_location text,
  ADD COLUMN IF NOT EXISTS gi_registry_match boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_gi_user boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gi_registry_match_reason varchar(80),
  ADD COLUMN IF NOT EXISTS gi_registry_application_number varchar(120),
  ADD COLUMN IF NOT EXISTS gi_registry_name varchar(220),
  ADD COLUMN IF NOT EXISTS gi_registry_goods varchar(120);

ALTER TABLE public.crops
  ADD COLUMN IF NOT EXISTS is_gi_product boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gi_product_name varchar(220),
  ADD COLUMN IF NOT EXISTS gi_registry_reference varchar(220);

CREATE TABLE IF NOT EXISTS public.gi_registry_products (
  id serial PRIMARY KEY,
  gi_name varchar(220) NOT NULL,
  application_number varchar(120) NOT NULL,
  goods varchar(120) NOT NULL,
  region varchar(220) NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (gi_name, application_number)
);

INSERT INTO public.gi_registry_products (gi_name, application_number, goods, region)
VALUES ('Kancheepuram Silk', '15', 'Handicraft', 'Kancheepuram, Tamil Nadu, India')
ON CONFLICT (gi_name, application_number) DO NOTHING;

-- Backfill accounts already registered before this migration.
UPDATE public.users
SET is_gi_user = true,
    gi_registry_match = true,
    gi_registry_match_reason = 'Kancheepuram Silk registry match',
    gi_registry_application_number = '15',
    gi_registry_name = 'Kancheepuram Silk',
    gi_registry_goods = 'Handicraft'
WHERE COALESCE(is_gi_user, false) = false
  AND (
    lower(regexp_replace(COALESCE(organisation_name, ''), '[^a-z0-9]+', ' ', 'gi')) ~ 'kancheepuram|kanchipuram|kancheeuram'
    OR lower(regexp_replace(COALESCE(profile_location, ''), '[^a-z0-9]+', ' ', 'gi')) ~ 'kancheepuram|kanchipuram|kancheeuram'
    OR lower(COALESCE(district, '')) ~ 'kancheepuram|kanchipuram'
  )
  AND lower(regexp_replace(concat_ws(' ', organisation_name, profile_location, district), '[^a-z0-9]+', ' ', 'gi')) ~ 'silk|silks|handloom|weaver|saree|cooperative|coop';

UPDATE public.crops c
SET is_gi_product = true,
    gi_product_name = COALESCE(u.gi_registry_name, 'Kancheepuram Silk'),
    gi_registry_reference = 'GI Application No. 15'
FROM public.users u
JOIN public.plantations p ON p.user_id = u.user_id
WHERE c.user_id = u.user_id
  AND c.plantation_id = p.id
  AND p.production_type = 'kancheepuram_silk'
  AND u.is_gi_user = true;

CREATE INDEX IF NOT EXISTS users_gi_user_idx ON public.users (is_gi_user) WHERE is_gi_user = true;
CREATE INDEX IF NOT EXISTS crops_gi_product_idx ON public.crops (is_gi_product) WHERE is_gi_product = true;

COMMIT;
