-- Add county column to suppliers table
ALTER TABLE suppliers
ADD COLUMN county VARCHAR(50) AFTER city,
ADD INDEX idx_suppliers_county (county);

-- Update existing records to set default county for major cities
UPDATE suppliers
SET county = 'B'
WHERE city = 'București';

UPDATE suppliers
SET county = 'CJ'
WHERE city = 'Cluj-Napoca';

UPDATE suppliers
SET county = 'TM'
WHERE city = 'Timișoara';

UPDATE suppliers
SET county = 'IS'
WHERE city = 'Iași';

UPDATE suppliers
SET county = 'CT'
WHERE city = 'Constanța';

UPDATE suppliers
SET county = 'BV'
WHERE city = 'Brașov';

UPDATE suppliers
SET county = 'DJ'
WHERE city = 'Craiova'; 