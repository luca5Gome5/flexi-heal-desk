-- Create table for specific availability dates
CREATE TABLE IF NOT EXISTS public.availabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  availability_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_procedure_day BOOLEAN DEFAULT false,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(unit_id, availability_date, start_time, procedure_id)
);

-- Enable RLS
ALTER TABLE public.availabilities ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on availabilities"
ON public.availabilities
FOR ALL
USING (true)
WITH CHECK (true);

-- Add index for better performance
CREATE INDEX idx_availabilities_unit_date ON public.availabilities(unit_id, availability_date);
CREATE INDEX idx_availabilities_date ON public.availabilities(availability_date);

-- Add trigger for updated_at
CREATE TRIGGER update_availabilities_updated_at
BEFORE UPDATE ON public.availabilities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Recreate the VIEW to use availabilities table with 1-hour slots
DROP VIEW IF EXISTS available_time_slots;

CREATE VIEW available_time_slots 
WITH (security_invoker = true) AS
WITH availability_slots AS (
  -- Generate hourly slots from availabilities table
  SELECT 
    a.unit_id,
    u.name as unit_name,
    a.availability_date,
    ts.slot_start as start_time,
    ts.slot_end as end_time,
    60 as slot_duration_minutes,
    a.procedure_id
  FROM availabilities a
  INNER JOIN units u ON u.id = a.unit_id AND u.status = true
  CROSS JOIN LATERAL generate_time_slots(a.start_time, a.end_time, 60) ts
)
-- Exclude slots that are already booked
SELECT 
  av.unit_id,
  av.unit_name,
  av.availability_date,
  av.start_time,
  av.end_time,
  av.slot_duration_minutes,
  av.procedure_id
FROM availability_slots av
LEFT JOIN appointments app ON 
  app.unit_id = av.unit_id
  AND app.appointment_date = av.availability_date
  AND app.status != 'cancelled'
  AND (
    -- Check if appointment overlaps with this slot
    (app.start_time <= av.start_time AND app.end_time > av.start_time)
    OR (app.start_time < av.end_time AND app.end_time >= av.end_time)
    OR (app.start_time >= av.start_time AND app.end_time <= av.end_time)
  )
WHERE app.id IS NULL  -- Only slots without appointments
ORDER BY av.availability_date, av.start_time;