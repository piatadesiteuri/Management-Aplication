-- Tabele pentru Stoc și Documente Farmacie

-- Tabel pentru Stoc Curent (cantități pe gestiuni)
CREATE TABLE IF NOT EXISTS pharmacy_stock (
  id INT PRIMARY KEY AUTO_INCREMENT,
  storage_id INT NOT NULL,
  article_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10, 2) DEFAULT 0,
  expiry_date DATE,
  batch_number VARCHAR(100),
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (storage_id) REFERENCES pharmacy_storages(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES pharmacy_articles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_stock_storage_article (storage_id, article_id),
  INDEX idx_pharmacy_stock_storage (storage_id),
  INDEX idx_pharmacy_stock_article (article_id),
  INDEX idx_pharmacy_stock_expiry (expiry_date)
);

-- Tabel pentru Note de Intrare (Recepție)
CREATE TABLE IF NOT EXISTS pharmacy_entry_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  note_number VARCHAR(50) NOT NULL UNIQUE,
  storage_id INT NOT NULL,
  supplier_id INT NOT NULL,
  entry_date DATE NOT NULL,
  reception_date DATE,
  document_number VARCHAR(100),
  document_date DATE,
  total_value DECIMAL(10, 2) DEFAULT 0,
  status ENUM('DRAFT', 'RECEIVED', 'VALIDATED', 'CANCELLED') DEFAULT 'DRAFT',
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (storage_id) REFERENCES pharmacy_storages(id) ON DELETE RESTRICT,
  FOREIGN KEY (supplier_id) REFERENCES pharmacy_suppliers(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_entry_notes_number (note_number),
  INDEX idx_entry_notes_storage (storage_id),
  INDEX idx_entry_notes_supplier (supplier_id),
  INDEX idx_entry_notes_status (status)
);

-- Tabel pentru Linii Note de Intrare
CREATE TABLE IF NOT EXISTS pharmacy_entry_note_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entry_note_id INT NOT NULL,
  article_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  expiry_date DATE,
  batch_number VARCHAR(100),
  line_number INT,
  FOREIGN KEY (entry_note_id) REFERENCES pharmacy_entry_notes(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES pharmacy_articles(id) ON DELETE RESTRICT,
  INDEX idx_entry_items_note (entry_note_id),
  INDEX idx_entry_items_article (article_id)
);

-- Tabel pentru Condici
CREATE TABLE IF NOT EXISTS pharmacy_registers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  register_number VARCHAR(50) NOT NULL UNIQUE,
  storage_id INT NOT NULL,
  register_date DATE NOT NULL,
  patient_name VARCHAR(255),
  patient_identity VARCHAR(50),
  doctor_name VARCHAR(255),
  prescription_number VARCHAR(100),
  total_value DECIMAL(10, 2) DEFAULT 0,
  status ENUM('DRAFT', 'ISSUED', 'CANCELLED') DEFAULT 'DRAFT',
  notes TEXT,
  issued_by INT,
  issued_at DATETIME,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (storage_id) REFERENCES pharmacy_storages(id) ON DELETE RESTRICT,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_registers_number (register_number),
  INDEX idx_registers_storage (storage_id),
  INDEX idx_registers_status (status)
);

-- Tabel pentru Linii Condici
CREATE TABLE IF NOT EXISTS pharmacy_register_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  register_id INT NOT NULL,
  article_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  line_number INT,
  FOREIGN KEY (register_id) REFERENCES pharmacy_registers(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES pharmacy_articles(id) ON DELETE RESTRICT,
  INDEX idx_register_items_register (register_id),
  INDEX idx_register_items_article (article_id)
);

-- Tabel pentru Rețete
CREATE TABLE IF NOT EXISTS pharmacy_prescriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  prescription_number VARCHAR(50) NOT NULL UNIQUE,
  storage_id INT NOT NULL,
  prescription_date DATE NOT NULL,
  patient_name VARCHAR(255),
  patient_identity VARCHAR(50),
  patient_age INT,
  patient_gender ENUM('M', 'F'),
  doctor_name VARCHAR(255),
  doctor_specialty VARCHAR(255),
  diagnosis TEXT,
  total_value DECIMAL(10, 2) DEFAULT 0,
  status ENUM('DRAFT', 'DISPENSED', 'CANCELLED', 'EXPIRED') DEFAULT 'DRAFT',
  notes TEXT,
  dispensed_by INT,
  dispensed_at DATETIME,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (storage_id) REFERENCES pharmacy_storages(id) ON DELETE RESTRICT,
  FOREIGN KEY (dispensed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_prescriptions_number (prescription_number),
  INDEX idx_prescriptions_storage (storage_id),
  INDEX idx_prescriptions_status (status)
);

-- Tabel pentru Linii Rețete
CREATE TABLE IF NOT EXISTS pharmacy_prescription_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  prescription_id INT NOT NULL,
  article_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  dosage VARCHAR(255),
  administration_route VARCHAR(100),
  frequency VARCHAR(100),
  duration_days INT,
  line_number INT,
  FOREIGN KEY (prescription_id) REFERENCES pharmacy_prescriptions(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES pharmacy_articles(id) ON DELETE RESTRICT,
  INDEX idx_prescription_items_prescription (prescription_id),
  INDEX idx_prescription_items_article (article_id)
);

-- Tabel pentru Mișcări Stoc (istoric)
CREATE TABLE IF NOT EXISTS pharmacy_stock_movements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  movement_date DATETIME NOT NULL,
  storage_id INT NOT NULL,
  article_id INT NOT NULL,
  movement_type ENUM('IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT') NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(10, 2),
  total_value DECIMAL(10, 2),
  document_type ENUM('ENTRY_NOTE', 'REGISTER', 'PRESCRIPTION', 'TRANSFER', 'ELABORATION', 'STOCK_INIT', 'ADJUSTMENT') NOT NULL,
  document_id INT,
  document_number VARCHAR(100),
  batch_number VARCHAR(100),
  expiry_date DATE,
  notes TEXT,
  performed_by INT,
  FOREIGN KEY (storage_id) REFERENCES pharmacy_storages(id) ON DELETE RESTRICT,
  FOREIGN KEY (article_id) REFERENCES pharmacy_articles(id) ON DELETE RESTRICT,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_movements_date (movement_date),
  INDEX idx_movements_storage (storage_id),
  INDEX idx_movements_article (article_id),
  INDEX idx_movements_type (movement_type),
  INDEX idx_movements_document (document_type, document_id)
);

-- Date de test pentru Stoc (pentru a avea articole disponibile)
INSERT INTO pharmacy_stock (storage_id, article_id, quantity, unit_cost, expiry_date, batch_number) VALUES
-- Stoc în Depozit Principal
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 500, 2.50, '2026-12-31', 'BATCH001'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 200, 5.00, '2026-11-30', 'BATCH002'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_003'), 150, 8.50, '2026-10-31', 'BATCH003'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_006'), 1000, 0.50, '2027-06-30', 'BATCH004'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_007'), 2000, 0.30, '2027-12-31', 'BATCH005'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_008'), 300, 3.00, '2027-08-31', 'BATCH006'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_009'), 500, 1.50, '2027-09-30', 'BATCH007'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_010'), 50, 15.00, '2027-12-31', 'BATCH008'),

-- Stoc în Farmacie Centrală
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 200, 2.50, '2026-12-31', 'BATCH009'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 100, 5.00, '2026-11-30', 'BATCH010'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_004'), 30, 25.00, '2026-09-30', 'BATCH011'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_005'), 50, 45.00, '2026-10-31', 'BATCH012'),

-- Stoc în Farmacie Urgențe
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 100, 2.50, '2026-12-31', 'BATCH013'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 50, 5.00, '2026-11-30', 'BATCH014'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_006'), 500, 0.50, '2027-06-30', 'BATCH015'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_007'), 1000, 0.30, '2027-12-31', 'BATCH016')
ON DUPLICATE KEY UPDATE quantity=quantity;
