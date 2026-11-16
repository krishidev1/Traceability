BEGIN;

ALTER TABLE public.plantations DROP CONSTRAINT IF EXISTS plantations_production_type_check;
ALTER TABLE public.plantations ADD CONSTRAINT plantations_production_type_check
  CHECK (production_type IN ('bee', 'kotpad_handloom', 'kancheepuram_silk', 'shrimp', 'fish', 'sambalpuri_bandha', 'vermicompost', 'pesticides'));

-- Production-specific detail storage. The shared crops table remains the
-- traceable parent record; details are kept in exactly one typed child table.
CREATE TABLE IF NOT EXISTS public.honey_production_details (
  id serial PRIMARY KEY,
  crop_id integer NOT NULL UNIQUE REFERENCES public.crops(id) ON DELETE CASCADE,
  plantation_id integer NOT NULL REFERENCES public.plantations(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.shrimp_production_details (
  id serial PRIMARY KEY,
  crop_id integer NOT NULL UNIQUE REFERENCES public.crops(id) ON DELETE CASCADE,
  plantation_id integer NOT NULL REFERENCES public.plantations(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.fish_production_details (
  id serial PRIMARY KEY,
  crop_id integer NOT NULL UNIQUE REFERENCES public.crops(id) ON DELETE CASCADE,
  plantation_id integer NOT NULL REFERENCES public.plantations(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.kotpad_handloom_details (
  id serial PRIMARY KEY,
  crop_id integer NOT NULL UNIQUE REFERENCES public.crops(id) ON DELETE CASCADE,
  plantation_id integer NOT NULL REFERENCES public.plantations(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.kancheepuram_silk_details (
  id serial PRIMARY KEY,
  crop_id integer NOT NULL UNIQUE REFERENCES public.crops(id) ON DELETE CASCADE,
  plantation_id integer NOT NULL REFERENCES public.plantations(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.sambalpuri_bandha_details (
  id serial PRIMARY KEY,
  crop_id integer NOT NULL UNIQUE REFERENCES public.crops(id) ON DELETE CASCADE,
  plantation_id integer NOT NULL REFERENCES public.plantations(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.vermicompost_production_details (
  id serial PRIMARY KEY,
  crop_id integer NOT NULL UNIQUE REFERENCES public.crops(id) ON DELETE CASCADE,
  plantation_id integer NOT NULL REFERENCES public.plantations(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.pesticide_production_details (
  id serial PRIMARY KEY,
  crop_id integer NOT NULL UNIQUE REFERENCES public.crops(id) ON DELETE CASCADE,
  plantation_id integer NOT NULL REFERENCES public.plantations(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_honey_details_plantation ON public.honey_production_details(plantation_id);
CREATE INDEX IF NOT EXISTS idx_shrimp_details_plantation ON public.shrimp_production_details(plantation_id);
CREATE INDEX IF NOT EXISTS idx_fish_details_plantation ON public.fish_production_details(plantation_id);
CREATE INDEX IF NOT EXISTS idx_kotpad_details_plantation ON public.kotpad_handloom_details(plantation_id);
CREATE INDEX IF NOT EXISTS idx_kancheepuram_details_plantation ON public.kancheepuram_silk_details(plantation_id);
CREATE INDEX IF NOT EXISTS idx_sambalpuri_details_plantation ON public.sambalpuri_bandha_details(plantation_id);
CREATE INDEX IF NOT EXISTS idx_vermicompost_details_plantation ON public.vermicompost_production_details(plantation_id);
CREATE INDEX IF NOT EXISTS idx_pesticide_details_plantation ON public.pesticide_production_details(plantation_id);

COMMIT;
