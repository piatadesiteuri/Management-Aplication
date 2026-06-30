-- Modul Farmacie - Schema bazei de date

-- Tabel pentru Unități (ex: Spitalul Central, Secția X, etc.)
CREATE TABLE IF NOT EXISTS pharmacy_units (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(500),
  phone VARCHAR(50),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pharmacy_units_code (code),
  INDEX idx_pharmacy_units_active (is_active)
);

-- Tabel pentru Gestiuni (pe fiecare unitate pot fi mai multe gestiuni)
CREATE TABLE IF NOT EXISTS pharmacy_storages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unit_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  storage_type ENUM('PRINCIPAL', 'SECUNDAR', 'DEPOZIT', 'SECȚIE') DEFAULT 'PRINCIPAL',
  location VARCHAR(255),
  responsible_person VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES pharmacy_units(id) ON DELETE CASCADE,
  UNIQUE KEY unique_storage_code_unit (unit_id, code),
  INDEX idx_pharmacy_storages_unit (unit_id),
  INDEX idx_pharmacy_storages_active (is_active)
);

-- Tabel pentru Tipuri de Articole
CREATE TABLE IF NOT EXISTS pharmacy_article_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel pentru Producători
CREATE TABLE IF NOT EXISTS pharmacy_manufacturers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  address VARCHAR(500),
  phone VARCHAR(50),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pharmacy_manufacturers_code (code)
);

-- Tabel pentru Unități de Măsură
CREATE TABLE IF NOT EXISTS pharmacy_units_of_measure (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  abbreviation VARCHAR(20),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel pentru Articole (medicamente, materiale, etc.)
CREATE TABLE IF NOT EXISTS pharmacy_articles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  article_type_id INT NOT NULL,
  manufacturer_id INT,
  unit_of_measure_id INT NOT NULL,
  atc_code VARCHAR(50), -- Cod ATC pentru medicamente
  cim_code VARCHAR(50), -- Cod CIM
  barcode VARCHAR(100),
  requires_prescription BOOLEAN DEFAULT FALSE,
  is_controlled BOOLEAN DEFAULT FALSE, -- Medicament controlat
  min_stock_level DECIMAL(10, 2) DEFAULT 0,
  max_stock_level DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (article_type_id) REFERENCES pharmacy_article_types(id) ON DELETE RESTRICT,
  FOREIGN KEY (manufacturer_id) REFERENCES pharmacy_manufacturers(id) ON DELETE SET NULL,
  FOREIGN KEY (unit_of_measure_id) REFERENCES pharmacy_units_of_measure(id) ON DELETE RESTRICT,
  INDEX idx_pharmacy_articles_code (code),
  INDEX idx_pharmacy_articles_type (article_type_id),
  INDEX idx_pharmacy_articles_manufacturer (manufacturer_id),
  INDEX idx_pharmacy_articles_active (is_active)
);

-- Tabel pentru Furnizori (poate fi diferit de furnizorii generali)
CREATE TABLE IF NOT EXISTS pharmacy_suppliers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  fiscal_code VARCHAR(50),
  registration_number VARCHAR(100),
  address VARCHAR(500),
  phone VARCHAR(50),
  email VARCHAR(255),
  contact_person VARCHAR(255),
  payment_terms VARCHAR(255),
  delivery_terms VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pharmacy_suppliers_code (code),
  INDEX idx_pharmacy_suppliers_active (is_active)
);

-- Seed date inițiale pentru Unități de Măsură
INSERT INTO pharmacy_units_of_measure (code, name, abbreviation) VALUES
('BUC', 'Bucată', 'buc'),
('FL', 'Fiolă', 'fl'),
('COMP', 'Comprimat', 'comp'),
('CAP', 'Capsulă', 'cap'),
('ML', 'Mililitru', 'ml'),
('GR', 'Gram', 'g'),
('KG', 'Kilogram', 'kg'),
('L', 'Litru', 'l'),
('TUB', 'Tub', 'tub'),
('PLIC', 'Plic', 'plic')
ON DUPLICATE KEY UPDATE name=name;

-- Seed date inițiale pentru Tipuri de Articole
INSERT INTO pharmacy_article_types (code, name) VALUES
('MEDICAMENT', 'Medicament'),
('MATERIAL_MEDICAL', 'Material medical'),
('DISPOZITIV_MEDICAL', 'Dispozitiv medical'),
('REACTIV', 'Reactiv'),
('CONSUMABIL', 'Consumabil'),
('INSTRUMENT', 'Instrument')
ON DUPLICATE KEY UPDATE name=name;
