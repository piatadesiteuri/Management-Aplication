-- Migrare pentru evenimente de transport și aprovizionare
-- Adaugă tabelul pentru gestionarea comenzilor de transport/aprovizionare

-- Tabel pentru elementele comandă din evenimentele de transport
CREATE TABLE IF NOT EXISTS event_transport_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    product_id INT NULL,
    product_name VARCHAR(255) NOT NULL,
    supplier_id INT NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    expected_delivery_date DATETIME NOT NULL,
    status ENUM('ORDERED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'ORDERED',
    notes TEXT NULL,
    created_by INT NOT NULL,
    processed_by INT NULL,
    processed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_event_transport_orders_event (event_id),
    INDEX idx_event_transport_orders_product (product_id),
    INDEX idx_event_transport_orders_supplier (supplier_id),
    INDEX idx_event_transport_orders_status (status),
    INDEX idx_event_transport_orders_delivery (expected_delivery_date)
);

-- Adaugă câmpul metadata în tabelul calendar_events (verificare și adăugare separată)
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS 
    WHERE table_schema = DATABASE() 
    AND table_name = 'calendar_events' 
    AND column_name = 'metadata'
);

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE calendar_events ADD COLUMN metadata JSON NULL COMMENT "Date specifice tipului de eveniment (transport, etc.)"', 
    'SELECT "Column metadata already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adaugă index pentru metadata (verificare și adăugare separată)
SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS 
    WHERE table_schema = DATABASE() 
    AND table_name = 'calendar_events' 
    AND index_name = 'idx_calendar_events_metadata'
);

SET @sql = IF(@index_exists = 0, 
    'CREATE INDEX idx_calendar_events_metadata ON calendar_events ((JSON_EXTRACT(metadata, "$.transportType")))', 
    'SELECT "Index idx_calendar_events_metadata already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Comentarii pentru documentație
ALTER TABLE event_transport_orders COMMENT = 'Gestionează elementele comenzilor pentru evenimente de transport și aprovizionare';

-- Exemplu de date de test pentru transport
INSERT IGNORE INTO event_transport_orders (
    event_id, product_id, product_name, supplier_id, supplier_name,
    quantity, unit_price, total_price, expected_delivery_date,
    status, notes, created_by
) VALUES 
(1, 1, 'Produs Test Transport', 1, 'Furnizor Test', 10, 25.50, 255.00, '2024-03-15 10:00:00', 'ORDERED', 'Comandă test pentru dezvoltare', 1); 