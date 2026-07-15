-- NIR (Nota de Receptie si Constatare Diferente) pentru comenzile de transport/aprovizionare
-- Extinde event_transport_orders cu cantitatea/prețul REAL primite la recepție
-- și adaugă un tabel de "cap de document" NIR per eveniment finalizat.

SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = 'event_transport_orders'
    AND column_name = 'received_quantity'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE event_transport_orders ADD COLUMN received_quantity DECIMAL(10,3) NULL COMMENT "Cantitate efectiv receptionata (poate diferi de cantitatea comandata)"',
    'SELECT "Column received_quantity already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE table_schema = DATABASE()
    AND table_name = 'event_transport_orders'
    AND column_name = 'received_unit_price'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE event_transport_orders ADD COLUMN received_unit_price DECIMAL(10,2) NULL COMMENT "Pret unitar efectiv facturat la receptie (poate diferi de pretul comandat)"',
    'SELECT "Column received_unit_price already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS event_transport_receptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    nir_number VARCHAR(50) NOT NULL,
    reception_date DATE NOT NULL,
    invoice_number VARCHAR(100) NULL,
    invoice_date DATE NULL,
    delivery_note_number VARCHAR(100) NULL COMMENT 'Aviz de insotire a marfii',
    vehicle_number VARCHAR(50) NULL COMMENT 'Auto/vagon nr.',
    delegate_name VARCHAR(255) NULL,
    tva_rate DECIMAL(5,2) NOT NULL DEFAULT 19.00,
    commission_member_1 VARCHAR(255) NULL,
    commission_member_2 VARCHAR(255) NULL,
    commission_member_3 VARCHAR(255) NULL,
    received_by_name VARCHAR(255) NULL COMMENT 'Primit in gestiune',
    notes TEXT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,

    UNIQUE KEY unique_nir_per_event (event_id),
    INDEX idx_nir_number (nir_number)
) COMMENT = 'Cap de document NIR (Nota de Receptie si Constatare Diferente) per eveniment de aprovizionare finalizat';
