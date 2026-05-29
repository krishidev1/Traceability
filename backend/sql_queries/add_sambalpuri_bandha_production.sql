BEGIN;

ALTER TABLE public.plantations
  ADD COLUMN IF NOT EXISTS production_type character varying(50) DEFAULT 'shrimp';

ALTER TABLE public.plantations
  ALTER COLUMN production_type SET DEFAULT 'shrimp';

UPDATE public.plantations
SET production_type = COALESCE(NULLIF(public.farms.crop_type, ''), 'shrimp')
FROM public.farms
WHERE public.plantations.farm_id = public.farms.farm_id
  AND public.farms.crop_type IN ('shrimp', 'bee', 'kotpad_handloom', 'sambalpuri_bandha')
  AND (
    public.plantations.production_type IS NULL
    OR public.plantations.production_type NOT IN ('shrimp', 'bee', 'kotpad_handloom', 'sambalpuri_bandha')
    OR public.plantations.production_type = 'shrimp'
  );

UPDATE public.plantations
SET production_type = 'shrimp'
WHERE production_type IS NULL
   OR production_type NOT IN ('shrimp', 'bee', 'kotpad_handloom', 'sambalpuri_bandha');

ALTER TABLE public.plantations
  DROP CONSTRAINT IF EXISTS plantations_production_type_check;

ALTER TABLE public.plantations
  ADD CONSTRAINT plantations_production_type_check
  CHECK (production_type IN ('shrimp', 'bee', 'kotpad_handloom', 'sambalpuri_bandha'));

CREATE TABLE IF NOT EXISTS public.sambalpuri_bandha_products
(
  id serial NOT NULL,
  user_id integer NOT NULL,
  plantation_id integer NOT NULL,
  crop_id integer NOT NULL,
  registered_name character varying(220) DEFAULT 'Sambalpuri Bandha Saree and Fabrics',
  gi_certificate_date date DEFAULT DATE '2012-07-17',
  gi_application_number character varying(120) DEFAULT '208',
  gi_category character varying(120) DEFAULT 'Handicraft',
  registration_holder text DEFAULT 'Directorate of Textiles & Handloom, Government of Odisha',
  head_office_location text DEFAULT 'Satyanagar, Bhubaneswar',
  associated_regions text DEFAULT 'Bargarh, Boudh, Sonepur, Bolangir, Nuapada, Sambalpur',
  product_type character varying(120),
  bandha_pattern_type character varying(120),
  fabric_material character varying(120),
  color_combination character varying(180),
  border_design character varying(180),
  motif_style character varying(180),
  product_description text,
  weaver_name character varying(180),
  weaver_id character varying(120),
  cooperative_name character varying(180),
  aadhaar_number character varying(80),
  mobile_number character varying(30),
  district character varying(120) DEFAULT 'Bargarh',
  gps_coordinates character varying(120) DEFAULT '21.3333, 83.6167',
  gi_region_match character varying(80) DEFAULT 'Verified',
  loom_type character varying(120),
  handloom_verification character varying(120) DEFAULT 'Approved',
  natural_dye_used character varying(40),
  texture_authenticity_score character varying(40) DEFAULT '91%',
  motif_match_score character varying(40) DEFAULT '94%',
  inspection_status character varying(80),
  authenticity_score character varying(40) DEFAULT '93%',
  qr_verification_code character varying(180),
  batch_number character varying(120),
  aadhaar_card_status character varying(80) DEFAULT 'Mandatory',
  weaver_registration_certificate_status character varying(80) DEFAULT 'Mandatory',
  cooperative_membership_proof_status character varying(80) DEFAULT 'Mandatory',
  product_images_status character varying(80) DEFAULT 'Mandatory',
  loom_images_status character varying(80) DEFAULT 'Mandatory',
  gi_authorization_certificate_status character varying(80) DEFAULT 'Mandatory',
  production_location_proof_status character varying(80) DEFAULT 'Mandatory',
  inspection_report_status character varying(80) DEFAULT 'Optional',
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sambalpuri_bandha_products_pkey PRIMARY KEY (id),
  CONSTRAINT sambalpuri_bandha_products_crop_id_key UNIQUE (crop_id),
  CONSTRAINT sambalpuri_bandha_products_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (user_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE,
  CONSTRAINT sambalpuri_bandha_products_plantation_id_fkey FOREIGN KEY (plantation_id)
    REFERENCES public.plantations (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE,
  CONSTRAINT sambalpuri_bandha_products_crop_id_fkey FOREIGN KEY (crop_id)
    REFERENCES public.crops (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS sambalpuri_bandha_products_user_id_idx
  ON public.sambalpuri_bandha_products (user_id);

CREATE INDEX IF NOT EXISTS sambalpuri_bandha_products_plantation_id_idx
  ON public.sambalpuri_bandha_products (plantation_id);

CREATE INDEX IF NOT EXISTS sambalpuri_bandha_products_crop_id_idx
  ON public.sambalpuri_bandha_products (crop_id);

COMMIT;
