-- Function to calculate Brazilian holidays
CREATE OR REPLACE FUNCTION get_brazilian_holidays(year_param integer)
RETURNS TABLE(holiday_date date) AS $$
DECLARE
  easter_date date;
BEGIN
  -- Calculate Easter (simplified Meeus algorithm)
  easter_date := (
    SELECT date_trunc('year', make_date(year_param, 1, 1)) + 
    interval '1 month' * (3 + ((24 + 19 * (year_param % 19)) % 30) / 29) +
    interval '1 day' * ((2 * (year_param % 4) + 4 * (year_param % 7) + 6 * ((24 + 19 * (year_param % 19)) % 30) + (year_param % 7)) % 7)
  );

  RETURN QUERY
  SELECT make_date(year_param, 1, 1)::date   -- Ano Novo
  UNION SELECT make_date(year_param, 4, 21)::date  -- Tiradentes
  UNION SELECT make_date(year_param, 5, 1)::date   -- Dia do Trabalho
  UNION SELECT make_date(year_param, 9, 7)::date   -- Independência
  UNION SELECT make_date(year_param, 10, 12)::date -- Nossa Senhora Aparecida
  UNION SELECT make_date(year_param, 11, 2)::date  -- Finados
  UNION SELECT make_date(year_param, 11, 15)::date -- Proclamação da República
  UNION SELECT make_date(year_param, 12, 25)::date -- Natal
  UNION SELECT (easter_date - interval '47 days')::date -- Carnaval (terça)
  UNION SELECT (easter_date - interval '2 days')::date  -- Sexta-feira Santa
  UNION SELECT (easter_date)::date                      -- Páscoa
  UNION SELECT (easter_date + interval '60 days')::date; -- Corpus Christi
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate time slots in 30-minute intervals
CREATE OR REPLACE FUNCTION generate_time_slots(
  start_time_param time,
  end_time_param time,
  interval_minutes integer DEFAULT 30
)
RETURNS TABLE(slot_start time, slot_end time) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t::time as slot_start,
    (t + (interval_minutes || ' minutes')::interval)::time as slot_end
  FROM generate_series(
    start_time_param::timestamp,
    end_time_param::timestamp - (interval_minutes || ' minutes')::interval,
    (interval_minutes || ' minutes')::interval
  ) t;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create the VIEW for available time slots
CREATE OR REPLACE VIEW available_time_slots AS
WITH date_series AS (
  -- Generate dates for next 12 months
  SELECT 
    generate_series(
      CURRENT_DATE,
      CURRENT_DATE + interval '12 months',
      interval '1 day'
    )::date as availability_date
),
holidays AS (
  -- Get all holidays for the period
  SELECT holiday_date 
  FROM get_brazilian_holidays(EXTRACT(YEAR FROM CURRENT_DATE)::integer)
  UNION
  SELECT holiday_date 
  FROM get_brazilian_holidays(EXTRACT(YEAR FROM CURRENT_DATE)::integer + 1)
),
valid_dates AS (
  -- Exclude Sundays and holidays
  SELECT d.availability_date
  FROM date_series d
  LEFT JOIN holidays h ON d.availability_date = h.holiday_date
  WHERE EXTRACT(DOW FROM d.availability_date) != 0  -- Not Sunday
    AND h.holiday_date IS NULL  -- Not a holiday
),
availability_slots AS (
  -- Generate all possible slots based on procedure_availability
  SELECT 
    pa.unit_id,
    u.name as unit_name,
    vd.availability_date,
    ts.slot_start as start_time,
    ts.slot_end as end_time,
    30 as slot_duration_minutes,
    pa.procedure_id
  FROM valid_dates vd
  CROSS JOIN procedure_availability pa
  INNER JOIN units u ON u.id = pa.unit_id AND u.status = true
  CROSS JOIN LATERAL generate_time_slots(pa.start_time, pa.end_time, 30) ts
  WHERE 
    -- Match day of week
    CASE pa.day_of_week
      WHEN 'monday' THEN EXTRACT(DOW FROM vd.availability_date) = 1
      WHEN 'tuesday' THEN EXTRACT(DOW FROM vd.availability_date) = 2
      WHEN 'wednesday' THEN EXTRACT(DOW FROM vd.availability_date) = 3
      WHEN 'thursday' THEN EXTRACT(DOW FROM vd.availability_date) = 4
      WHEN 'friday' THEN EXTRACT(DOW FROM vd.availability_date) = 5
      WHEN 'saturday' THEN EXTRACT(DOW FROM vd.availability_date) = 6
    END
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