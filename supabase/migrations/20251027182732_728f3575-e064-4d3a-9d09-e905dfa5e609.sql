-- Add duration unit field to procedures table
ALTER TABLE public.procedures 
ADD COLUMN duration_unit TEXT DEFAULT 'minutes' CHECK (duration_unit IN ('minutes', 'hours'));