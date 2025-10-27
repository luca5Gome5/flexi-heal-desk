-- Add new columns to patients table
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS rg text,
ADD COLUMN IF NOT EXISTS address_number text,
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS marital_status text,
ADD COLUMN IF NOT EXISTS occupation text,
ADD COLUMN IF NOT EXISTS consultation_reason text;