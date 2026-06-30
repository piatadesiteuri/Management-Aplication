-- Portal pacienți / aparținători (MVP)
-- Legături user <-> patient (SELF / CAREGIVER), mesagerie bidirecțională, documente medicale, date de locație/medic curant pe episod.

CREATE TABLE IF NOT EXISTS patient_user_links (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  patient_id INT NOT NULL,
  relationship ENUM('SELF', 'CAREGIVER') NOT NULL,
  relationship_label VARCHAR(80) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_patient_user_link (user_id, patient_id, relationship),
  INDEX idx_pul_patient (patient_id),
  INDEX idx_pul_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Mesagerie: conversații pe pacient + mesaje
CREATE TABLE IF NOT EXISTS patient_message_threads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  subject VARCHAR(200) NOT NULL,
  status ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pmt_patient (patient_id, status),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS patient_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  thread_id INT NOT NULL,
  sender_user_id INT NOT NULL,
  sender_type ENUM('PATIENT', 'CAREGIVER', 'STAFF') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pm_thread (thread_id, created_at),
  FOREIGN KEY (thread_id) REFERENCES patient_message_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Documente medicale în arhiva electronică (MVP). (Nu include actele de identitate; acelea sunt în patient_identity_documents)
CREATE TABLE IF NOT EXISTS patient_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  category ENUM('FO', 'BILET_EXTERNARE', 'SCRISOARE_MEDICALA', 'REZULTAT_LAB', 'IMAGISTICA', 'ALTELE') DEFAULT 'ALTELE',
  title VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pd_patient (patient_id, created_at),
  INDEX idx_pd_category (category),
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Date de localizare & medic curant pentru acces aparținători
-- (secție = department, plus detalii: etaj / salon / medic / telefon)
ALTER TABLE patient_episodes
  ADD COLUMN ward VARCHAR(120) NULL,
  ADD COLUMN room VARCHAR(40) NULL,
  ADD COLUMN floor VARCHAR(20) NULL,
  ADD COLUMN attending_doctor_name VARCHAR(120) NULL,
  ADD COLUMN attending_doctor_phone VARCHAR(40) NULL;


