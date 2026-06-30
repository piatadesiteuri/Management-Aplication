-- Adăugare rol de Magazioner și sistem de notificări
-- Migration pentru rolul de Magazioner și gestionarea stocului

-- Adăugare rol nou în enum-ul existent
ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN', 'INSPECTOR', 'MANAGER', 'WAREHOUSE_KEEPER') NOT NULL;

-- Tabel pentru stocul produselor
CREATE TABLE IF NOT EXISTS product_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    supplier_id INT NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_level INT NOT NULL DEFAULT 0,
    max_stock_level INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_supplier (product_id, supplier_id)
);

-- Tabel pentru istoricul stocului
CREATE TABLE IF NOT EXISTS stock_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    supplier_id INT NOT NULL,
    event_id INT NULL,
    change_type ENUM('IN', 'OUT', 'ADJUSTMENT', 'LOSS', 'EXPIRED') NOT NULL,
    quantity_change INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason VARCHAR(500) NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel pentru notificări
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('TRANSPORT_ORDER', 'STOCK_ALERT', 'DELIVERY_CONFIRMED', 'SYSTEM') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
);

-- Indexuri pentru performanță
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX idx_stock_history_created_at ON stock_history(created_at);

-- Trigger pentru actualizarea automată a stocului când se confirmă o livrare
DELIMITER //
CREATE TRIGGER update_stock_on_delivery_confirmation
AFTER UPDATE ON calendar_events
FOR EACH ROW
BEGIN
    IF NEW.metadata IS NOT NULL AND OLD.metadata IS NOT NULL THEN
        DECLARE delivery_status VARCHAR(50);
        DECLARE order_items JSON;
        DECLARE item_count INT DEFAULT 0;
        DECLARE i INT DEFAULT 0;
        DECLARE product_id INT;
        DECLARE quantity INT;
        
        -- Extragem statusul de livrare din metadata
        SET delivery_status = JSON_UNQUOTE(JSON_EXTRACT(NEW.metadata, '$.deliveryStatus'));
        
        -- Dacă statusul s-a schimbat la DELIVERED
        IF delivery_status = 'DELIVERED' AND JSON_UNQUOTE(JSON_EXTRACT(OLD.metadata, '$.deliveryStatus')) != 'DELIVERED' THEN
            -- Extragem orderItems din metadata
            SET order_items = JSON_EXTRACT(NEW.metadata, '$.orderItems');
            SET item_count = JSON_LENGTH(order_items);
            
            -- Parcurgem fiecare item din comandă
            WHILE i < item_count DO
                SET product_id = JSON_UNQUOTE(JSON_EXTRACT(order_items, CONCAT('$[', i, '].productId')));
                SET quantity = JSON_UNQUOTE(JSON_EXTRACT(order_items, CONCAT('$[', i, '].quantity')));
                
                -- Actualizăm stocul
                INSERT INTO stock_history (product_id, supplier_id, event_id, change_type, quantity_change, previous_stock, new_stock, reason, created_by)
                SELECT 
                    product_id,
                    (SELECT supplier_id FROM event_transport_orders WHERE event_id = NEW.id AND product_id = product_id LIMIT 1),
                    NEW.id,
                    'IN',
                    quantity,
                    COALESCE((SELECT current_stock FROM product_stock WHERE product_id = product_id LIMIT 1), 0),
                    COALESCE((SELECT current_stock FROM product_stock WHERE product_id = product_id LIMIT 1), 0) + quantity,
                    'Livrare confirmată',
                    NEW.user_id
                ON DUPLICATE KEY UPDATE
                    current_stock = current_stock + quantity,
                    last_updated = CURRENT_TIMESTAMP;
                
                SET i = i + 1;
            END WHILE;
        END IF;
    END IF;
END//
DELIMITER ;

-- Inserare date de test pentru Magazioner
INSERT INTO users (username, email, password_hash, role, department_id, created_at) 
VALUES ('magazioner1', 'magazioner@dspd.ro', '$2b$10$example_hash', 'WAREHOUSE_KEEPER', 1, NOW())
ON DUPLICATE KEY UPDATE role = 'WAREHOUSE_KEEPER';

-- Inserare stoc inițial pentru produse
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
