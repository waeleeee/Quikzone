-- Update delivery_fees default value to 8 DT for new expéditeurs
ALTER TABLE shippers ALTER COLUMN delivery_fees SET DEFAULT 8;

-- Update delivery_fees default value to 8 DT for new parcels
ALTER TABLE parcels ALTER COLUMN delivery_fees SET DEFAULT 8;

-- Verify the changes
SELECT 
    table_name, 
    column_name, 
    column_default 
FROM information_schema.columns 
WHERE column_name = 'delivery_fees' 
AND table_schema = 'public'; 