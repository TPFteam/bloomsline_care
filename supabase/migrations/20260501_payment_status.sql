-- Add payment_status and price to sessions and bookings
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price NUMERIC;
