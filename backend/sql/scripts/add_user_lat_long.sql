-- Migration script to add latitude and longitude columns to public.users table

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;
