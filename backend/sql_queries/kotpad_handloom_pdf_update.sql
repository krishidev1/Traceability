BEGIN;

ALTER TABLE public.kotpad_handloom_fabrics
  ADD COLUMN IF NOT EXISTS gi_application_number character varying(120);

UPDATE public.kotpad_handloom_fabrics
SET
  product_name = COALESCE(product_name, 'Kotpad Handloom Fabric'),
  gi_application_number = COALESCE(gi_application_number, gi_tag_number, '10'),
  category = COALESCE(category, 'Handloom / Textile'),
  state = COALESCE(state, 'Odisha'),
  district = COALESCE(district, 'Koraput'),
  region_cluster = COALESCE(region_cluster, 'Kotpad Village'),
  gi_registration_date = COALESCE(gi_registration_date, DATE '2005-06-02'),
  community_name = COALESCE(community_name, 'Mirgan Community'),
  fabric_type = COALESCE(fabric_type, 'Cotton'),
  natural_dye_used = COALESCE(natural_dye_used, 'Aal Tree Bark'),
  loom_type = COALESCE(loom_type, 'Pit Loom'),
  weaving_technique = COALESCE(weaving_technique, 'Traditional Handloom'),
  natural_dye_usage = COALESCE(natural_dye_usage, TRUE),
  marketplace_visibility = COALESCE(marketplace_visibility, 'Public');

ALTER TABLE public.kotpad_handloom_fabrics
  ALTER COLUMN product_name SET DEFAULT 'Kotpad Handloom Fabric',
  ALTER COLUMN gi_application_number SET DEFAULT '10',
  ALTER COLUMN category SET DEFAULT 'Handloom / Textile',
  ALTER COLUMN state SET DEFAULT 'Odisha',
  ALTER COLUMN district SET DEFAULT 'Koraput',
  ALTER COLUMN region_cluster SET DEFAULT 'Kotpad Village',
  ALTER COLUMN gi_registration_date SET DEFAULT DATE '2005-06-02',
  ALTER COLUMN community_name SET DEFAULT 'Mirgan Community',
  ALTER COLUMN fabric_type SET DEFAULT 'Cotton',
  ALTER COLUMN natural_dye_used SET DEFAULT 'Aal Tree Bark',
  ALTER COLUMN loom_type SET DEFAULT 'Pit Loom',
  ALTER COLUMN weaving_technique SET DEFAULT 'Traditional Handloom',
  ALTER COLUMN natural_dye_usage SET DEFAULT TRUE,
  ALTER COLUMN marketplace_visibility SET DEFAULT 'Public';

COMMIT;
