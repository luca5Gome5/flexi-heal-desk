-- Add pricing fields to procedures table
ALTER TABLE public.procedures 
ADD COLUMN price_fixed DECIMAL(10,2),
ADD COLUMN price_per_ml DECIMAL(10,2),
ADD COLUMN price_card DECIMAL(10,2);