-- Schema pentru Aplicația de Formulare Electronice
-- Suportă formulare clinice și non-clinice, cu constructor de formulare

USE spital_brasov;

-- Tipuri de formulare
CREATE TABLE IF NOT EXISTS form_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type ENUM('CLINIC', 'NON_CLINIC', 'PRESCRIPTION') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_form_category_name (name)
);

-- Template-uri de formulare (definiții)
CREATE TABLE IF NOT EXISTS form_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  requires_signature BOOLEAN DEFAULT FALSE,
  signature_order JSON NULL, -- Ordinea semnărilor [{"role": "DOCTOR", "order": 1}, ...]
  metadata JSON NULL, -- Metadate suplimentare (documente justificative, reguli, etc.)
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_form_template_code_version (code, version),
  FOREIGN KEY (category_id) REFERENCES form_categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_form_templates_category (category_id),
  INDEX idx_form_templates_active (is_active)
);

-- Câmpuri ale formularelor (configurare dinamică)
CREATE TABLE IF NOT EXISTS form_fields (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_id INT NOT NULL,
  field_key VARCHAR(100) NOT NULL,
  field_type ENUM('TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'DATETIME', 'SELECT', 'MULTISELECT', 'CHECKBOX', 'RADIO', 'FILE', 'SIGNATURE') NOT NULL,
  label VARCHAR(255) NOT NULL,
  placeholder VARCHAR(255),
  description TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  validation_rules JSON NULL, -- Reguli de validare (min, max, pattern, etc.)
  options JSON NULL, -- Opțiuni pentru SELECT/RADIO/CHECKBOX
  default_value TEXT,
  display_order INT DEFAULT 0,
  section VARCHAR(100), -- Grupare în secțiuni
  visibility_rules JSON NULL, -- Reguli de vizibilitate condiționată
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE CASCADE,
  INDEX idx_form_fields_template (template_id),
  INDEX idx_form_fields_order (template_id, display_order)
);

-- Instanțe de formulare (formulare completate sau în draft)
CREATE TABLE IF NOT EXISTS form_instances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_id INT NOT NULL,
  instance_number VARCHAR(50), -- Număr unic de instanță (ex: FORM-2025-000123)
  status ENUM('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SIGNED', 'ARCHIVED') DEFAULT 'DRAFT',
  submitted_by INT NULL,
  submitted_at DATETIME NULL,
  form_data JSON NOT NULL, -- Datele completate
  attachments JSON NULL, -- Lista de fișiere atașate
  registry_entry_id INT NULL, -- Legătură cu registratura
  registry_work_id INT NULL, -- Legătură cu lucrarea din registrul unic
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE RESTRICT,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (registry_entry_id) REFERENCES registry_entries(id) ON DELETE SET NULL,
  FOREIGN KEY (registry_work_id) REFERENCES registry_works(id) ON DELETE SET NULL,
  INDEX idx_form_instances_template (template_id),
  INDEX idx_form_instances_status (status),
  INDEX idx_form_instances_submitted_by (submitted_by),
  INDEX idx_form_instances_created_by (created_by),
  INDEX idx_form_instances_instance_number (instance_number)
);

-- Istoricul semnăturilor pentru formulare
CREATE TABLE IF NOT EXISTS form_signatures (
  id INT PRIMARY KEY AUTO_INCREMENT,
  instance_id INT NOT NULL,
  signer_id INT NOT NULL,
  signer_role VARCHAR(50),
  signature_order INT NOT NULL,
  signature_type ENUM('ELECTRONIC', 'QUALIFIED', 'SEAL') NOT NULL,
  signature_data JSON NULL, -- Date despre semnătură (hash, certificat, etc.)
  signed_at DATETIME NOT NULL,
  ip_address VARCHAR(45),
  reason TEXT, -- Motivul semnării
  FOREIGN KEY (instance_id) REFERENCES form_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (signer_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_form_signatures_instance (instance_id),
  INDEX idx_form_signatures_signer (signer_id)
);

-- Comentarii și note pe formulare
CREATE TABLE IF NOT EXISTS form_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  instance_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  comment_type ENUM('COMMENT', 'REVIEW', 'REJECTION_REASON') DEFAULT 'COMMENT',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instance_id) REFERENCES form_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_form_comments_instance (instance_id)
);

-- Legături între formulare și arhiva electronică
CREATE TABLE IF NOT EXISTS form_archive_links (
  id INT PRIMARY KEY AUTO_INCREMENT,
  instance_id INT NOT NULL,
  archive_document_id INT NULL, -- ID din arhiva electronică (mock pentru moment)
  document_type VARCHAR(50),
  document_name VARCHAR(255),
  linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  linked_by INT NOT NULL,
  FOREIGN KEY (instance_id) REFERENCES form_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_form_archive_links_instance (instance_id)
);

-- Seed date demo pentru categorii
INSERT INTO form_categories (name, description, type) VALUES
('Formulare Clinice', 'Formulare pentru activitatea clinică', 'CLINIC'),
('Formulare Non-Clinice', 'Formulare administrative și de management', 'NON_CLINIC'),
('Prescripții și Rețete', 'Rețete electronice și prescripții medicale', 'PRESCRIPTION')
ON DUPLICATE KEY UPDATE name=name;

-- Seed template demo: Fișă de observație clinică
INSERT INTO form_templates (category_id, code, name, description, requires_signature, created_by)
SELECT 
  fc.id,
  'FISA_OBSERVATIE_CLINICA',
  'Fișă de Observație Clinică',
  'Formular pentru înregistrarea observațiilor clinice',
  TRUE,
  (SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1)
FROM form_categories fc
WHERE fc.name = 'Formulare Clinice'
ON DUPLICATE KEY UPDATE code=code;

-- Seed câmpuri pentru fișa de observație
INSERT INTO form_fields (template_id, field_key, field_type, label, is_required, display_order, section)
SELECT 
  ft.id,
  'patient_name',
  'TEXT',
  'Nume Pacient',
  TRUE,
  1,
  'Date Pacient'
FROM form_templates ft
WHERE ft.code = 'FISA_OBSERVATIE_CLINICA'
ON DUPLICATE KEY UPDATE template_id=template_id;

INSERT INTO form_fields (template_id, field_key, field_type, label, is_required, display_order, section)
SELECT 
  ft.id,
  'observation_date',
  'DATE',
  'Data Observației',
  TRUE,
  2,
  'Date Pacient'
FROM form_templates ft
WHERE ft.code = 'FISA_OBSERVATIE_CLINICA'
ON DUPLICATE KEY UPDATE template_id=template_id;

INSERT INTO form_fields (template_id, field_key, field_type, label, is_required, display_order, section)
SELECT 
  ft.id,
  'clinical_notes',
  'TEXTAREA',
  'Observații Clinice',
  TRUE,
  3,
  'Observații'
FROM form_templates ft
WHERE ft.code = 'FISA_OBSERVATIE_CLINICA'
ON DUPLICATE KEY UPDATE template_id=template_id;

INSERT INTO form_fields (template_id, field_key, field_type, label, is_required, display_order, section)
SELECT 
  ft.id,
  'diagnosis',
  'TEXT',
  'Diagnostic',
  FALSE,
  4,
  'Diagnostic'
FROM form_templates ft
WHERE ft.code = 'FISA_OBSERVATIE_CLINICA'
ON DUPLICATE KEY UPDATE template_id=template_id;

INSERT INTO form_fields (template_id, field_key, field_type, label, is_required, display_order, section)
SELECT 
  ft.id,
  'attachments',
  'FILE',
  'Documente Atașate',
  FALSE,
  5,
  'Atașamente'
FROM form_templates ft
WHERE ft.code = 'FISA_OBSERVATIE_CLINICA'
ON DUPLICATE KEY UPDATE template_id=template_id;

