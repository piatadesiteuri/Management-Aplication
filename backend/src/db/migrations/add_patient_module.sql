-- Modul: Patient Administration Module (PAM) - model clinic minim (HIS/EMR)
-- Entități: Patient (identitate), Identity Documents (scan), Insurance Status (istoric),
-- Episode (internare/ambulatoriu), Appointment (scheduling), Observation (monitorizare),
-- Resource (medic/cabinet/echipament).

CREATE TABLE IF NOT EXISTS patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  identity_type ENUM('CNP', 'PASAPORT', 'TEMPORAR') NOT NULL,
  identity_number VARCHAR(32) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NULL,
  gender ENUM('M', 'F', 'X', 'UNKNOWN') DEFAULT 'UNKNOWN',
  contact_data JSON NULL,
  insurance_status_current ENUM('ASIGURAT', 'NEASIGURAT', 'NECLAR') DEFAULT 'NECLAR',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_patient_identity (identity_type, identity_number),
  INDEX idx_patients_name (last_name, first_name),
  INDEX idx_patients_identity (identity_number),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS patient_identity_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  document_type ENUM('CI', 'PASAPORT', 'TEMPORAR', 'ALTELE') NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by INT NOT NULL,
  verified_by INT NULL,
  verified_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pid_patient (patient_id),
  INDEX idx_pid_verified (verified_at),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Istoric calitate de asigurat (nu doar "check live")
CREATE TABLE IF NOT EXISTS patient_insurance_status (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  status ENUM('ASIGURAT', 'NEASIGURAT', 'NECLAR') NOT NULL,
  valid_from DATE NULL,
  valid_to DATE NULL,
  source VARCHAR(120) NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pis_patient (patient_id, created_at),
  INDEX idx_pis_status (status),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Episod medical (critică pentru conformitate clinică)
CREATE TABLE IF NOT EXISTS patient_episodes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  type ENUM('INTERNARE', 'AMBULATORIU') NOT NULL,
  status ENUM('PROGRAMAT', 'INTERNAT', 'EXTERNAT', 'CANCELLED') DEFAULT 'PROGRAMAT',
  department_id INT NULL,
  start_date DATETIME NULL,
  end_date DATETIME NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pe_patient (patient_id, status),
  INDEX idx_pe_status (status, start_date),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Resurse pentru scheduling (medic/cabinet/echipament)
CREATE TABLE IF NOT EXISTS medical_resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('MEDIC', 'EQUIPMENT', 'CABINET') NOT NULL,
  name VARCHAR(255) NOT NULL,
  department_id INT NULL,
  details JSON NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mr_type (type),
  INDEX idx_mr_department (department_id),
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  episode_id INT NULL,
  service_type ENUM('AMBULATORIU', 'LABORATOR', 'IMAGISTICA') NOT NULL,
  resource_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status ENUM('SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'SCHEDULED',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_appt_patient (patient_id, start_time),
  INDEX idx_appt_resource (resource_id, start_time),
  INDEX idx_appt_status (status),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (episode_id) REFERENCES patient_episodes(id) ON DELETE SET NULL,
  FOREIGN KEY (resource_id) REFERENCES medical_resources(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Monitorizare (date clinice introduse progresiv)
CREATE TABLE IF NOT EXISTS patient_observations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  episode_id INT NULL,
  type ENUM('VITALS', 'LAB_RESULT', 'NOTE') NOT NULL,
  value TEXT NOT NULL,
  recorded_at DATETIME NOT NULL,
  recorded_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_po_patient (patient_id, recorded_at),
  INDEX idx_po_episode (episode_id, recorded_at),
  INDEX idx_po_type (type),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (episode_id) REFERENCES patient_episodes(id) ON DELETE SET NULL,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
);


