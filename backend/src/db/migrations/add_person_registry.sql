-- PAM: Registru persoane (MOCK) pentru căutare după CNP/Pasaport (auto-completare)
-- În producție asta ar fi integrare cu sisteme externe (DEPABD/CNAS/SIUI etc.).

CREATE TABLE IF NOT EXISTS person_registry (
  id INT PRIMARY KEY AUTO_INCREMENT,
  identity_type ENUM('CNP', 'PASAPORT', 'TEMPORAR') NOT NULL,
  identity_number VARCHAR(32) NOT NULL,
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  date_of_birth DATE NULL,
  gender ENUM('M', 'F', 'X', 'UNKNOWN') DEFAULT 'UNKNOWN',
  address_json JSON NULL,
  document_series VARCHAR(16) NULL,
  document_number VARCHAR(32) NULL,
  source VARCHAR(80) DEFAULT 'MOCK',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_person_identity (identity_type, identity_number),
  INDEX idx_person_name (last_name, first_name)
);

-- Demo records (poți șterge/edita)
INSERT IGNORE INTO person_registry
  (identity_type, identity_number, first_name, last_name, date_of_birth, gender, address_json, document_series, document_number, source)
VALUES
  ('CNP', '1960101220018', 'ION', 'POPESCU', '1996-01-01', 'M', JSON_OBJECT('street','Str. Exemplu','number','10','city','Brașov'), 'BV', '123456', 'MOCK'),
  ('CNP', '2960101220026', 'MARIA', 'IONESCU', '1996-01-01', 'F', JSON_OBJECT('street','Str. Spitalului','number','5','city','Brașov'), 'BV', '654321', 'MOCK');


