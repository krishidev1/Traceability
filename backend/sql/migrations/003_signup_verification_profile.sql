BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS aadhaar_number_encrypted text,
  ADD COLUMN IF NOT EXISTS mobile_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gstin varchar(15),
  ADD COLUMN IF NOT EXISTS gst_registered_phone varchar(30),
  ADD COLUMN IF NOT EXISTS gst_mobile_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gi_registry_document text,
  ADD COLUMN IF NOT EXISTS gi_registry_document_name varchar(255),
  ADD COLUMN IF NOT EXISTS profile_location text;

CREATE UNIQUE INDEX IF NOT EXISTS users_gstin_unique_idx
  ON public.users (gstin)
  WHERE gstin IS NOT NULL AND gstin <> '';

COMMIT;
