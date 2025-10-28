-- Fix the generate_time_slots function to handle time type correctly
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
    ('2000-01-01 ' || start_time_param::text)::timestamp,
    ('2000-01-01 ' || end_time_param::text)::timestamp - (interval_minutes || ' minutes')::interval,
    (interval_minutes || ' minutes')::interval
  ) t;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path = public;