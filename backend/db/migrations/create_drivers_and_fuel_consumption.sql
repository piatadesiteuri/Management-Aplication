-- Tabel pentru șoferi
CREATE TABLE IF NOT EXISTS drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    cnp VARCHAR(13) UNIQUE,
    license_number VARCHAR(20) UNIQUE,
    phone VARCHAR(20),
    email VARCHAR(100),
    department_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Tabel pentru asignarea șoferilor la vehicule
CREATE TABLE IF NOT EXISTS vehicle_drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    assigned_date DATE NOT NULL,
    unassigned_date DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_active_assignment (vehicle_id, driver_id, is_active)
);

-- Tabel pentru consumul zilnic de motorină
CREATE TABLE IF NOT EXISTS daily_fuel_consumption (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    
    -- Restul de combustibil de la sfârșitul zilei anterioare (litri)
    previous_day_remaining_liters DECIMAL(10,2) DEFAULT 0,
    previous_day_remaining_lei DECIMAL(10,2) DEFAULT 0,
    
    -- Carburant alimentat (litri)
    fuel_supplied_liters DECIMAL(10,2) DEFAULT 0,
    fuel_supplied_lei DECIMAL(10,2) DEFAULT 0,
    
    -- Total carburant disponibil (litri și lei)
    total_fuel_liters DECIMAL(10,2) DEFAULT 0,
    total_fuel_lei DECIMAL(10,2) DEFAULT 0,
    
    -- Consum efectiv (litri și lei)
    consumed_liters DECIMAL(10,2) DEFAULT 0,
    consumed_lei DECIMAL(10,2) DEFAULT 0,
    
    -- Restul în rezervor la sfârșitul zilei (litri și lei)
    end_day_remaining_liters DECIMAL(10,2) DEFAULT 0,
    end_day_remaining_lei DECIMAL(10,2) DEFAULT 0,
    
    -- Preț mediu pe litru
    average_price_per_liter DECIMAL(10,2) DEFAULT 0,
    
    -- Status: DRAFT, COMPLETED
    status ENUM('DRAFT', 'COMPLETED') DEFAULT 'DRAFT',
    
    -- Observații
    notes TEXT,
    
    -- Utilizator care a creat/modificat
    created_by INT NOT NULL,
    updated_by INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_daily_vehicle (date, vehicle_id)
);

-- Indexuri pentru performanță
CREATE INDEX idx_daily_fuel_consumption_date ON daily_fuel_consumption(date);
CREATE INDEX idx_daily_fuel_consumption_vehicle ON daily_fuel_consumption(vehicle_id);
CREATE INDEX idx_daily_fuel_consumption_driver ON daily_fuel_consumption(driver_id);
CREATE INDEX idx_vehicle_drivers_active ON vehicle_drivers(vehicle_id, is_active);
CREATE INDEX idx_drivers_active ON drivers(is_active);
