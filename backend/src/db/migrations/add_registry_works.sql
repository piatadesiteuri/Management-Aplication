-- Extindere modul Registratură: separare LUCRARE (Registrul Unic) vs ACT (Registru de acte)
-- Model:
--  - LUCRARE = unitate de evidență în Registrul Unic (numerotare unică instituție/an)
--  - ACT = document individual, evidențiat într-un registru de acte (per structură)
--  - O lucrare poate avea 1..N acte (legătură work ↔ entry)
--  - Circulația internă se păstrează ca istoric (transferuri/route)

CREATE TABLE IF NOT EXISTS registry_works (
  id INT PRIMARY KEY AUTO_INCREMENT,
  unic_register_id INT NOT NULL,
  year INT NOT NULL,
  number INT NOT NULL,
  direction ENUM('IN', 'OUT', 'INTERNAL') NOT NULL,
  channel ENUM('PHYSICAL', 'ONLINE', 'INTERNAL') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sender_name VARCHAR(255),
  sender_entity VARCHAR(255),
  recipient_name VARCHAR(255),
  recipient_entity VARCHAR(255),
  received_at DATETIME NULL,
  sent_at DATETIME NULL,
  status ENUM('RECEIVED', 'ASSIGNED', 'IN_PROGRESS', 'FINALIZED', 'ARCHIVED', 'CANCELLED') DEFAULT 'RECEIVED',
  assigned_department_id INT NULL,
  assigned_to_user_id INT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_registry_works_number (unic_register_id, year, number),
  INDEX idx_registry_works_register (unic_register_id, year),
  INDEX idx_registry_works_status (status),
  INDEX idx_registry_works_channel (channel),
  INDEX idx_registry_works_direction (direction),
  INDEX idx_registry_works_assigned_department (assigned_department_id),
  FOREIGN KEY (unic_register_id) REFERENCES registry_registers(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Legătura LUCRARE ↔ ACT (un act poate aparține unei lucrări; o lucrare poate avea mai multe acte)
CREATE TABLE IF NOT EXISTS registry_work_entries (
  work_id INT NOT NULL,
  entry_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (work_id, entry_id),
  INDEX idx_registry_work_entries_entry (entry_id),
  FOREIGN KEY (work_id) REFERENCES registry_works(id) ON DELETE CASCADE,
  FOREIGN KEY (entry_id) REFERENCES registry_entries(id) ON DELETE CASCADE
);

-- Istoric circulație internă (traseu) pentru LUCRARE
CREATE TABLE IF NOT EXISTS registry_work_transfers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  work_id INT NOT NULL,
  from_department_id INT NULL,
  to_department_id INT NULL,
  from_user_id INT NULL,
  to_user_id INT NULL,
  note VARCHAR(500) NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_registry_work_transfers_work (work_id, created_at),
  FOREIGN KEY (work_id) REFERENCES registry_works(id) ON DELETE CASCADE,
  FOREIGN KEY (from_department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (to_department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);


