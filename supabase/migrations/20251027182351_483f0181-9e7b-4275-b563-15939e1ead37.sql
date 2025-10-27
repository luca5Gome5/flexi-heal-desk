-- Remove old pricing columns and add new structured pricing fields
ALTER TABLE public.procedures 
DROP COLUMN IF EXISTS price_fixed,
DROP COLUMN IF EXISTS price_per_ml,
DROP COLUMN IF EXISTS price_card;

-- Add new pricing structure
ALTER TABLE public.procedures 
ADD COLUMN pricing_type TEXT CHECK (pricing_type IN ('fixed', 'per_ml')),
ADD COLUMN price_cash DECIMAL(10,2),
ADD COLUMN price_card DECIMAL(10,2),
ADD COLUMN max_installments INTEGER DEFAULT 1;