-- Schema pentru Modulul de Interoperabilitate
-- Gestionarea integrărilor cu sisteme externe și raportare automată

USE spital_brasov;

-- Configurare integrări externe
CREATE TABLE IF NOT EXISTS interoperability_integrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('RAPORTARE', 'VERIFICARE', 'INTEGRARE', 'STANDARD') NOT NULL,
  endpoint_url VARCHAR(500),
  api_key VARCHAR(255),
  api_secret VARCHAR(255),
  config_json JSON NULL, -- Configurare suplimentară (timeout, retry, etc.)
  status ENUM('ACTIVE', 'INACTIVE', 'ERROR', 'PLANNED') DEFAULT 'PLANNED',
  last_connection_test DATETIME NULL,
  last_connection_status ENUM('SUCCESS', 'FAILED', 'PENDING') NULL,
  last_connection_error TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_interoperability_integrations_code (code),
  INDEX idx_interoperability_integrations_status (status)
);

-- Istoric rapoarte trimise către sisteme externe
CREATE TABLE IF NOT EXISTS interoperability_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  integration_id INT NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- 'DRG', 'STATISTIC', 'ASIGURAT', etc.
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  status ENUM('PENDING', 'SENT', 'CONFIRMED', 'ERROR', 'RETRY') DEFAULT 'PENDING',
  payload_json JSON NULL, -- Datele raportului
  response_json JSON NULL, -- Răspunsul de la sistemul extern
  error_message TEXT NULL,
  retry_count INT DEFAULT 0,
  sent_at DATETIME NULL,
  confirmed_at DATETIME NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (integration_id) REFERENCES interoperability_integrations(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_interoperability_reports_integration (integration_id),
  INDEX idx_interoperability_reports_status (status),
  INDEX idx_interoperability_reports_period (report_period_start, report_period_end)
);

-- Log-uri de comunicare cu sisteme externe
CREATE TABLE IF NOT EXISTS interoperability_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  integration_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'CONNECTION_TEST', 'REPORT_SENT', 'DATA_FETCHED', etc.
  request_url VARCHAR(500),
  request_method VARCHAR(10),
  request_payload JSON NULL,
  response_status INT NULL,
  response_body TEXT NULL,
  duration_ms INT NULL, -- Durata request-ului în milisecunde
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (integration_id) REFERENCES interoperability_integrations(id) ON DELETE CASCADE,
  INDEX idx_interoperability_logs_integration (integration_id),
  INDEX idx_interoperability_logs_created_at (created_at)
);

-- Configurare raportare automată
CREATE TABLE IF NOT EXISTS interoperability_auto_report_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  integration_id INT NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  schedule_type ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY') NOT NULL,
  schedule_day INT NULL, -- Ziua din lună/săptămână
  schedule_time TIME NOT NULL, -- Ora la care se trimite
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at DATETIME NULL,
  next_run_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (integration_id) REFERENCES interoperability_integrations(id) ON DELETE CASCADE,
  INDEX idx_interoperability_auto_report_configs_integration (integration_id),
  INDEX idx_interoperability_auto_report_configs_next_run (next_run_at)
);

-- Seed integrări externe (conform cerințelor)
INSERT INTO interoperability_integrations (code, name, description, type, status) VALUES
('CNAS_DRG', 'CNAS-DRG', 'Conectare directă la serverele CNAS-DRG pentru raportare DRG și decontare', 'RAPORTARE', 'PLANNED'),
('SIUI', 'SIUI', 'Integrare cu Sistemul Informatic Unic de Identificare pentru verificare calitate asigurat', 'VERIFICARE', 'PLANNED'),
('CM', 'Casa de Asigurări de Sănătate (CM)', 'Raportare statistică și decontare către Casa de Asigurări de Sănătate', 'RAPORTARE', 'PLANNED'),
('DES', 'DES (Direcția Executivă de Sănătate)', 'Raportare statistică și monitorizare activitate medicală', 'RAPORTARE', 'PLANNED'),
('LIS', 'LIS (Laboratory Information System)', 'Integrare cu sistemele de laborator pentru schimb de date analize', 'INTEGRARE', 'PLANNED'),
('RIS_PACS', 'RIS/PACS', 'Integrare cu sistemele de radiologie și arhivare imagini medicale', 'INTEGRARE', 'PLANNED'),
('HL7_FHIR', 'HL7/FHIR', 'Standard pentru schimb de date medicale între sisteme', 'STANDARD', 'PLANNED')
ON DUPLICATE KEY UPDATE name=name;
