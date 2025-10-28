-- Add consultation_price column to units table
ALTER TABLE public.units 
ADD COLUMN consultation_price NUMERIC(10, 2);