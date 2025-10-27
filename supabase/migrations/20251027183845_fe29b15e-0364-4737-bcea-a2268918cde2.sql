-- Add procedure_id to media table
ALTER TABLE public.media
ADD COLUMN procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_media_procedure_id ON public.media(procedure_id);