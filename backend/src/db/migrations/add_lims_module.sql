-- Modul LIMS (Laboratory Information Management System)
-- Gestionarea cererilor de analize, laboratoare, teste/probe

-- Tabel pentru laboratoare
CREATE TABLE IF NOT EXISTS laboratories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  address VARCHAR(500),
  phone VARCHAR(50),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_laboratories_active (is_active),
  INDEX idx_laboratories_code (code)
);

-- Tabel pentru medici de laborator (responsabili)
CREATE TABLE IF NOT EXISTS laboratory_doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  laboratory_id INT NOT NULL,
  user_id INT NOT NULL,
  is_responsible BOOLEAN DEFAULT FALSE,
  specialization VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_lab_doctor (laboratory_id, user_id),
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_lab_doctors_lab (laboratory_id),
  INDEX idx_lab_doctors_user (user_id)
);

-- Tabel pentru categorii de teste/probe
CREATE TABLE IF NOT EXISTS test_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  parent_id INT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES test_categories(id) ON DELETE SET NULL,
  INDEX idx_test_categories_active (is_active),
  INDEX idx_test_categories_code (code)
);

-- Tabel pentru teste/probe disponibile
CREATE TABLE IF NOT EXISTS laboratory_tests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  sample_type ENUM('SANGE', 'URINA', 'FECES', 'SPUTA', 'LICHID_CEFALORAHIDIAN', 'ALTUL') NOT NULL,
  preparation_instructions TEXT,
  normal_values TEXT,
  unit VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  requires_special_handling BOOLEAN DEFAULT FALSE,
  estimated_duration_hours INT DEFAULT 24,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES test_categories(id) ON DELETE SET NULL,
  INDEX idx_lab_tests_active (is_active),
  INDEX idx_lab_tests_code (code),
  INDEX idx_lab_tests_category (category_id)
);

-- Tabel pentru cereri de analize
CREATE TABLE IF NOT EXISTS analysis_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_number VARCHAR(50) NOT NULL UNIQUE,
  patient_id INT NOT NULL,
  laboratory_id INT NOT NULL,
  responsible_doctor_id INT NULL,
  referring_doctor_id INT NULL,
  diagnosis TEXT,
  observations TEXT,
  status ENUM('DRAFT', 'SUBMITTED', 'RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
  reception_type ENUM('WITH_RECEPTION', 'WITH_LABELING', 'WITHOUT_RECEPTION') DEFAULT 'WITHOUT_RECEPTION',
  reception_date DATETIME NULL,
  labeling_date DATETIME NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT,
  FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE RESTRICT,
  FOREIGN KEY (responsible_doctor_id) REFERENCES laboratory_doctors(id) ON DELETE SET NULL,
  FOREIGN KEY (referring_doctor_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_analysis_requests_patient (patient_id),
  INDEX idx_analysis_requests_lab (laboratory_id),
  INDEX idx_analysis_requests_status (status),
  INDEX idx_analysis_requests_number (request_number),
  INDEX idx_analysis_requests_created (created_at)
);

-- Tabel pentru teste selectate într-o cerere de analize
CREATE TABLE IF NOT EXISTS analysis_request_tests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  request_id INT NOT NULL,
  test_id INT NOT NULL,
  priority ENUM('NORMAL', 'URGENT', 'STAT') DEFAULT 'NORMAL',
  notes TEXT,
  status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  result_value TEXT NULL,
  result_unit VARCHAR(50) NULL,
  result_interpretation TEXT NULL,
  completed_at DATETIME NULL,
  completed_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES analysis_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES laboratory_tests(id) ON DELETE RESTRICT,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_request_tests_request (request_id),
  INDEX idx_request_tests_test (test_id),
  INDEX idx_request_tests_status (status)
);

-- Seed date demo: Laborator
INSERT INTO laboratories (name, code, description, address, phone, email) VALUES
('Laboratorul Central de Analize', 'LAB_CENTRAL', 'Laboratorul central pentru analize medicale', 'Str. Principală nr. 1, Brașov', '0268-123456', 'lab.central@spitalbrasov.ro')
ON DUPLICATE KEY UPDATE name=name;

-- Seed date demo: Categorii de teste
INSERT INTO test_categories (name, code, description, display_order) VALUES
('Hematologie', 'HEM', 'Analize hematologice', 1),
('Biochimie', 'BIO', 'Analize biochimice', 2),
('Microbiologie', 'MICRO', 'Analize microbiologice', 3),
('Imunologie', 'IMMUN', 'Analize imunologice', 4),
('Coagulare', 'COAG', 'Teste de coagulare', 5)
ON DUPLICATE KEY UPDATE name=name;

-- Seed date demo: Teste
INSERT INTO laboratory_tests (category_id, name, code, description, sample_type, unit, estimated_duration_hours) 
SELECT 
  tc.id,
  'Hemogramă completă',
  'HEM_CBC',
  'Numărătoare completă a celulelor sanguine',
  'SANGE',
  NULL,
  2
FROM test_categories tc WHERE tc.code = 'HEM'
ON DUPLICATE KEY UPDATE laboratory_tests.name=laboratory_tests.name;

INSERT INTO laboratory_tests (category_id, name, code, description, sample_type, unit, estimated_duration_hours) 
SELECT 
  tc.id,
  'Glicemie',
  'BIO_GLUCOSE',
  'Determinarea nivelului de glucoză în sânge',
  'SANGE',
  'mg/dL',
  1
FROM test_categories tc WHERE tc.code = 'BIO'
ON DUPLICATE KEY UPDATE laboratory_tests.name=laboratory_tests.name;

INSERT INTO laboratory_tests (category_id, name, code, description, sample_type, unit, estimated_duration_hours) 
SELECT 
  tc.id,
  'Creatinină',
  'BIO_CREATININE',
  'Determinarea nivelului de creatinină',
  'SANGE',
  'mg/dL',
  2
FROM test_categories tc WHERE tc.code = 'BIO'
ON DUPLICATE KEY UPDATE laboratory_tests.name=laboratory_tests.name;

INSERT INTO laboratory_tests (category_id, name, code, description, sample_type, unit, estimated_duration_hours) 
SELECT 
  tc.id,
  'Uree',
  'BIO_UREA',
  'Determinarea nivelului de uree',
  'SANGE',
  'mg/dL',
  2
FROM test_categories tc WHERE tc.code = 'BIO'
ON DUPLICATE KEY UPDATE laboratory_tests.name=laboratory_tests.name;

INSERT INTO laboratory_tests (category_id, name, code, description, sample_type, unit, estimated_duration_hours) 
SELECT 
  tc.id,
  'Analiză urină completă',
  'BIO_URINE',
  'Analiză completă a urinei',
  'URINA',
  NULL,
  3
FROM test_categories tc WHERE tc.code = 'BIO'
ON DUPLICATE KEY UPDATE laboratory_tests.name=laboratory_tests.name;

INSERT INTO laboratory_tests (category_id, name, code, description, sample_type, unit, estimated_duration_hours) 
SELECT 
  tc.id,
  'Cultura bacteriologică',
  'MICRO_CULTURE',
  'Cultura pentru identificarea bacteriilor',
  'SPUTA',
  NULL,
  48
FROM test_categories tc WHERE tc.code = 'MICRO'
ON DUPLICATE KEY UPDATE laboratory_tests.name=laboratory_tests.name;
