-- Tabel pentru istoricul de mentenanță
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  date DATE NOT NULL,
  type VARCHAR(100) NOT NULL,
  description TEXT,
  cost DECIMAL(10,2) DEFAULT 0.00,
  mileage INT DEFAULT 0,
  performed_by VARCHAR(255),
  status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'COMPLETED',
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_vehicle_maintenance_vehicle_id (vehicle_id),
  INDEX idx_vehicle_maintenance_date (date)
);

-- Tabel pentru istoricul de combustibil
CREATE TABLE IF NOT EXISTS vehicle_fuel_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  date DATE NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  mileage INT NOT NULL,
  fuel_type ENUM('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID') DEFAULT 'DIESEL',
  location VARCHAR(255),
  driver VARCHAR(255),
  efficiency DECIMAL(5,2) COMMENT 'L/100km',
  cost_per_km DECIMAL(8,4) COMMENT 'RON/km',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_vehicle_fuel_vehicle_id (vehicle_id),
  INDEX idx_vehicle_fuel_date (date)
);

-- Tabel pentru istoricul de utilizare
CREATE TABLE IF NOT EXISTS vehicle_usage_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  user_id INT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_mileage INT NOT NULL,
  end_mileage INT NOT NULL,
  purpose VARCHAR(255),
  route TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_vehicle_usage_vehicle_id (vehicle_id),
  INDEX idx_vehicle_usage_dates (start_date, end_date)
); 