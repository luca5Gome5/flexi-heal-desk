-- Create kanban_stages table
CREATE TABLE public.kanban_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  order_position INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  stage_id UUID REFERENCES public.kanban_stages(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kanban_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies for kanban_stages
CREATE POLICY "Allow all operations on kanban_stages"
  ON public.kanban_stages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for leads
CREATE POLICY "Allow all operations on leads"
  ON public.leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at on kanban_stages
CREATE TRIGGER update_kanban_stages_updated_at
  BEFORE UPDATE ON public.kanban_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on leads
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default stages
INSERT INTO public.kanban_stages (name, order_position, color) VALUES
  ('Novo Lead', 1, '#3b82f6'),
  ('Contato Inicial', 2, '#8b5cf6'),
  ('Qualificado', 3, '#ec4899'),
  ('Proposta Enviada', 4, '#f59e0b'),
  ('Convertido', 5, '#10b981');