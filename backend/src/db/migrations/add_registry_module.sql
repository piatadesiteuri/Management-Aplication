-- Modul Registratură (MVP)
-- Cerințe acoperite: Registrul Unic + Registre de acte, intrare/ieșire/intern, numerotare unică, multi-an, închidere de an (prin API/job)

CREATE TABLE IF NOT EXISTS registry_registers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('REGISTRU_UNIC', 'REGISTRU_ACTE') NOT NULL,
  year INT NOT NULL,
  status ENUM('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_registry_registers_code (code),
  INDEX idx_registry_registers_type_year (type, year),
  INDEX idx_registry_registers_status (status),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Permite ca mai multe structuri/departamente să folosească același registru de acte
CREATE TABLE IF NOT EXISTS registry_register_departments (
  register_id INT NOT NULL,
  department_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (register_id, department_id),
  FOREIGN KEY (register_id) REFERENCES registry_registers(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- Contor pentru numerotare unică per registru + an (locking cu SELECT ... FOR UPDATE)
CREATE TABLE IF NOT EXISTS registry_counters (
  register_id INT NOT NULL,
  year INT NOT NULL,
  next_number INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (register_id, year),
  FOREIGN KEY (register_id) REFERENCES registry_registers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS registry_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  register_id INT NOT NULL,
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
  status ENUM('RECEIVED', 'ASSIGNED', 'IN_PROGRESS', 'CLOSED', 'CANCELLED') DEFAULT 'RECEIVED',
  assigned_department_id INT NULL,
  assigned_to_user_id INT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_registry_entries_number (register_id, year, number),
  INDEX idx_registry_entries_register (register_id, year),
  INDEX idx_registry_entries_direction (direction),
  INDEX idx_registry_entries_channel (channel),
  INDEX idx_registry_entries_status (status),
  INDEX idx_registry_entries_assigned_department (assigned_department_id),
  FOREIGN KEY (register_id) REFERENCES registry_registers(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS registry_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entry_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_registry_documents_entry (entry_id),
  FOREIGN KEY (entry_id) REFERENCES registry_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT
);




