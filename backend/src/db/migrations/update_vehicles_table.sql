-- Drop the existing vehicles table
DROP TABLE IF EXISTS vehicles;

-- Create the updated vehicles table
CREATE TABLE vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  registration_number VARCHAR(20) NOT NULL UNIQUE,
  year INT NOT NULL,
  status ENUM('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE') DEFAULT 'AVAILABLE',
  category VARCHAR(50) NOT NULL,
  fuel_type ENUM('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC') NOT NULL,
  tank_capacity DECIMAL(10,2) NOT NULL,
  current_mileage INT NOT NULL DEFAULT 0,
  assigned_department_id INT,
  observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_department_id) REFERENCES departments(id) ON DELETE SET NULL
); 