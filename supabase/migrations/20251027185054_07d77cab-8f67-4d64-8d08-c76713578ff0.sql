-- Add procedure_id to message_templates table
ALTER TABLE public.message_templates
ADD COLUMN procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_message_templates_procedure_id ON public.message_templates(procedure_id);