-- Create table for doctor-unit relationship (many-to-many)
CREATE TABLE public.doctor_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(doctor_id, unit_id)
);

-- Enable Row Level Security
ALTER TABLE public.doctor_units ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on doctor_units" ON public.doctor_units FOR ALL USING (true) WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_doctor_units_doctor_id ON public.doctor_units(doctor_id);
CREATE INDEX idx_doctor_units_unit_id ON public.doctor_units(unit_id);