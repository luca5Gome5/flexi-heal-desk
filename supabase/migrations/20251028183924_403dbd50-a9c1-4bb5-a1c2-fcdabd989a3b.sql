-- Add amount_paid column to appointments table
ALTER TABLE appointments 
ADD COLUMN amount_paid DECIMAL(10, 2);