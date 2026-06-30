-- Script pentru popularea datelor de test pentru Magazioner
-- Rulare: mysql -u root -p DSPD < seed_warehouse_keeper.sql

-- 1. Adăugare rol WAREHOUSE_KEEPER în tabelul roles (dacă nu există)
INSERT IGNORE INTO roles (name, description, created_at) 
VALUES ('WAREHOUSE_KEEPER', 'Magazioner cu acces la gestionarea stocului', NOW());

-- 2. Creare utilizator Magazioner (dacă nu există)
INSERT IGNORE INTO users (username, email, password, first_name, last_name, role, department_id, is_active, is_email_verified)
VALUES (
    'magazioner1', 
    'magazioner@dspd.ro', 
    '$2b$10$example_hash_here', 
    'Magazioner', 
    'Test', 
    'WAREHOUSE_KEEPER', 
    1, 
    1, 
    1
);

-- 3. Populare stoc inițial pentru produse existente
INSERT INTO product_stock (product_id, supplier_id, current_stock, min_stock_level, max_stock_level, unit_price)
SELECT 
    p.id,
    sp.supplier_id,
    FLOOR(RAND() * 100) + 10, -- Stoc aleatoriu între 10-110
    5, -- Nivel minim
    200, -- Nivel maxim
    sp.unit_price
FROM products p
CROSS JOIN supplier_products sp
WHERE p.id = sp.product_id
ON DUPLICATE KEY UPDATE
    current_stock = VALUES(current_stock),
    unit_price = VALUES(unit_price);

-- 4. Creare notificări de test pentru Magazioner
INSERT INTO notifications (user_id, title, message, type, status)
SELECT 
    u.id,
    'Bun venit în sistem!',
    'Bun venit în sistemul de gestionare stoc DSPD. Poți începe să gestionezi stocul produselor.',
    'info',
    'unread'
FROM users u
WHERE u.role = 'WAREHOUSE_KEEPER'
LIMIT 1;

-- 5. Verificare date create
SELECT 'Utilizatori Magazioner:' as info;
SELECT id, username, email, role FROM users WHERE role = 'WAREHOUSE_KEEPER';

SELECT 'Stoc produse:' as info;
SELECT COUNT(*) as count FROM product_stock;

SELECT 'Notificări:' as info;
SELECT COUNT(*) as count FROM notifications;
