BEGIN;

CREATE SCHEMA IF NOT EXISTS public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'app_role'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('grower', 'supplier');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.users (
  user_id serial PRIMARY KEY,
  full_name varchar(100) NOT NULL,
  email varchar(150) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  mob varchar(255),
  role varchar(30) NOT NULL DEFAULT 'farmer',
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  latitude numeric,
  longitude numeric,
  geofence_radius numeric,
  geofence_polygon jsonb,
  account_type varchar(50),
  organization_name varchar(150),
  coordinator_name varchar(150),
  profile_image text,
  village_area varchar(150),
  district varchar(100),
  state varchar(100),
  country varchar(100),
  pincode varchar(20),
  gps_coordinates varchar(100),
  is_verified boolean NOT NULL DEFAULT false,
  verification_status varchar(30) NOT NULL DEFAULT 'pending',
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  company_logo text,
  video_url text
);

CREATE INDEX IF NOT EXISTS users_mob_idx
  ON public.users (mob)
  WHERE mob IS NOT NULL AND mob <> '';

CREATE TABLE IF NOT EXISTS public.user_roles (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.users (user_id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id serial PRIMARY KEY,
  identifier varchar(150) NOT NULL,
  requested_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  handled boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.login_activity_logs (
  id serial PRIMARY KEY,
  user_id integer REFERENCES public.users (user_id) ON DELETE SET NULL,
  identifier varchar(150),
  success boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.farms (
  farm_id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.users (user_id) ON DELETE CASCADE,
  farm_name varchar(255),
  farm_location text,
  latitude double precision,
  longitude double precision,
  polygon_coordinates jsonb,
  land_size double precision,
  crop_type varchar(100),
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  boundary jsonb
);

CREATE TABLE IF NOT EXISTS public.plantations (
  id serial PRIMARY KEY,
  farm_id integer NOT NULL REFERENCES public.farms (farm_id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users (user_id) ON DELETE CASCADE,
  name text NOT NULL,
  location_description text,
  polygon_coordinates jsonb,
  area_hectares numeric,
  status text NOT NULL DEFAULT 'active',
  production_type varchar(50) NOT NULL DEFAULT 'shrimp',
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT plantations_production_type_check
    CHECK (production_type IN ('shrimp', 'bee', 'kotpad_handloom', 'sambalpuri_bandha'))
);

CREATE TABLE IF NOT EXISTS public.crops (
  id serial PRIMARY KEY,
  plantation_id integer NOT NULL REFERENCES public.plantations (id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users (user_id) ON DELETE CASCADE,
  crop_name text NOT NULL,
  crop_variety text,
  sowing_date date,
  expected_harvest_date date,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.harvests (
  id serial PRIMARY KEY,
  plantation_id integer NOT NULL REFERENCES public.plantations (id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users (user_id) ON DELETE CASCADE,
  crop_id integer REFERENCES public.crops (id) ON DELETE SET NULL,
  harvest_date date NOT NULL,
  total_quantity numeric NOT NULL,
  accepted_quantity numeric,
  rejected_quantity numeric,
  unit text NOT NULL DEFAULT 'kg',
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.monitoring_records (
  id serial PRIMARY KEY,
  plantation_id integer NOT NULL REFERENCES public.plantations (id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users (user_id) ON DELETE CASCADE,
  crop_id integer REFERENCES public.crops (id) ON DELETE SET NULL,
  date date NOT NULL,
  input_type text NOT NULL,
  remarks text,
  photo_url text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.verifications (
  id serial PRIMARY KEY,
  plantation_id integer NOT NULL REFERENCES public.plantations (id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users (user_id) ON DELETE CASCADE,
  crop_id integer REFERENCES public.crops (id) ON DELETE SET NULL,
  inspection_date date NOT NULL,
  crop_health text NOT NULL,
  approved_for_harvest boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.packings (
  id serial PRIMARY KEY,
  plantation_id integer NOT NULL REFERENCES public.plantations (id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users (user_id) ON DELETE CASCADE,
  harvest_id integer REFERENCES public.harvests (id) ON DELETE SET NULL,
  packing_date date NOT NULL,
  number_of_packages integer NOT NULL,
  net_weight numeric NOT NULL,
  packing_size text,
  warehouse_name text,
  street text,
  city text,
  state text,
  pincode text,
  country text,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.process_images (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.users (user_id) ON DELETE CASCADE,
  plantation_id integer NOT NULL REFERENCES public.plantations (id) ON DELETE CASCADE,
  stage text NOT NULL,
  process_name text NOT NULL,
  image_url text NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.patches (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.users (user_id) ON DELETE CASCADE,
  patch_id text NOT NULL UNIQUE,
  description text,
  total_weight numeric,
  unit text NOT NULL DEFAULT 'kg',
  items jsonb,
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.sambalpuri_bandha_products (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.users (user_id) ON DELETE CASCADE,
  plantation_id integer NOT NULL REFERENCES public.plantations (id) ON DELETE CASCADE,
  crop_id integer NOT NULL UNIQUE REFERENCES public.crops (id) ON DELETE CASCADE,
  registered_name varchar(220) DEFAULT 'Sambalpuri Bandha Saree and Fabrics',
  gi_certificate_date date DEFAULT DATE '2012-07-17',
  gi_application_number varchar(120) DEFAULT '208',
  gi_category varchar(120) DEFAULT 'Handicraft',
  registration_holder text DEFAULT 'Directorate of Textiles & Handloom, Government of Odisha',
  head_office_location text DEFAULT 'Satyanagar, Bhubaneswar',
  associated_regions text DEFAULT 'Bargarh, Boudh, Sonepur, Bolangir, Nuapada, Sambalpur',
  product_type varchar(120),
  bandha_pattern_type varchar(120),
  fabric_material varchar(120),
  color_combination varchar(180),
  border_design varchar(180),
  motif_style varchar(180),
  product_description text,
  weaver_name varchar(180),
  weaver_id varchar(120),
  cooperative_name varchar(180),
  aadhaar_number varchar(80),
  mobile_number varchar(30),
  district varchar(120) DEFAULT 'Bargarh',
  gps_coordinates varchar(120) DEFAULT '21.3333, 83.6167',
  gi_region_match varchar(80) DEFAULT 'Verified',
  loom_type varchar(120),
  handloom_verification varchar(120) DEFAULT 'Approved',
  natural_dye_used varchar(40),
  texture_authenticity_score varchar(40) DEFAULT '91%',
  motif_match_score varchar(40) DEFAULT '94%',
  inspection_status varchar(80),
  authenticity_score varchar(40) DEFAULT '93%',
  qr_verification_code varchar(180),
  batch_number varchar(120),
  aadhaar_card_status varchar(80) DEFAULT 'Mandatory',
  weaver_registration_certificate_status varchar(80) DEFAULT 'Mandatory',
  cooperative_membership_proof_status varchar(80) DEFAULT 'Mandatory',
  product_images_status varchar(80) DEFAULT 'Mandatory',
  loom_images_status varchar(80) DEFAULT 'Mandatory',
  gi_authorization_certificate_status varchar(80) DEFAULT 'Mandatory',
  production_location_proof_status varchar(80) DEFAULT 'Mandatory',
  inspection_report_status varchar(80) DEFAULT 'Optional',
  created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS farms_user_id_idx ON public.farms (user_id);
CREATE INDEX IF NOT EXISTS plantations_user_id_idx ON public.plantations (user_id);
CREATE INDEX IF NOT EXISTS plantations_farm_id_idx ON public.plantations (farm_id);
CREATE INDEX IF NOT EXISTS crops_plantation_id_idx ON public.crops (plantation_id);
CREATE INDEX IF NOT EXISTS harvests_plantation_id_idx ON public.harvests (plantation_id);
CREATE INDEX IF NOT EXISTS monitoring_records_plantation_id_idx ON public.monitoring_records (plantation_id);
CREATE INDEX IF NOT EXISTS verifications_plantation_id_idx ON public.verifications (plantation_id);
CREATE INDEX IF NOT EXISTS packings_plantation_id_idx ON public.packings (plantation_id);
CREATE INDEX IF NOT EXISTS process_images_plantation_id_idx ON public.process_images (plantation_id);
CREATE INDEX IF NOT EXISTS patches_user_id_idx ON public.patches (user_id);
CREATE INDEX IF NOT EXISTS sambalpuri_bandha_products_user_id_idx
  ON public.sambalpuri_bandha_products (user_id);
CREATE INDEX IF NOT EXISTS sambalpuri_bandha_products_plantation_id_idx
  ON public.sambalpuri_bandha_products (plantation_id);

COMMIT;
