-- Re-order enum: drop and recreate with correct order
-- First update existing values to temp, then recreate
-- Actually, enum order doesn't matter for storage, only UI order matters
-- So no migration needed, just UI changes
SELECT 1;