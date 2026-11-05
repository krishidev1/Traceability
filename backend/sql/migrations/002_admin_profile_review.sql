BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_type varchar(50),
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_status varchar(30) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Keep the review queue query fast while excluding the separately managed admin account.
CREATE INDEX IF NOT EXISTS users_verification_review_idx
  ON public.users (verification_status, created_at DESC)
  WHERE COALESCE(account_type, role, '') <> 'admin';

-- Existing deployments may already contain valid rows, so this is intentionally NOT VALID.
-- It applies to new/updated rows immediately and can be validated during a maintenance window.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_verification_status_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_verification_status_check
      CHECK (verification_status IN ('pending', 'approved', 'rejected')) NOT VALID;
  END IF;
END
$$;

-- Sample admin credentials for local/staging verification only.
-- Email: admin@traceconnect.in
-- Password: Admin@123
-- Change this password before using the account in production.
INSERT INTO public.users (
  account_type,
  role,
  full_name,
  email,
  password_hash,
  is_verified,
  verification_status
)
SELECT
  'admin',
  'admin',
  'TraceConnect Admin',
  'admin@traceconnect.in',
  'pbkdf2_sha512$120000$2a08018a79874fb34f28910ca3590a7f$56d1cf94567e9bb2b156fbd3e20b29d6cf61035b9c96135c3b6591f9b355ec622e7add6e7ef3457ffda20d818249297e11676379fbe3947d7ee23bbb876da33f',
  TRUE,
  'approved'
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE LOWER(email) = 'admin@traceconnect.in'
);

COMMIT;
