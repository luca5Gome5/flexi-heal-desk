-- Add exam_requirements column to procedures table
ALTER TABLE public.procedures 
ADD COLUMN exam_requirements JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN public.procedures.exam_requirements IS 'Structured exam requirements with gender, age, and conditions. Format: [{"id": "uuid", "gender": "male|female|other|all", "age_min": number, "age_max": number, "conditions": ["condition1"], "exams": ["exam1", "exam2"]}]';