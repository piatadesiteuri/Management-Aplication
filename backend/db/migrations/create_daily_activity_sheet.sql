-- Tabel pentru fișa activității zilnice
CREATE TABLE IF NOT EXISTS daily_activity_sheet (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    
    -- Informații de bază
    trip_sheet_number VARCHAR(20),
    
    -- Timp în exploatare
    operating_time_hours DECIMAL(5,2) DEFAULT 0,
    
    -- Parcurs (km)
    kilometers_interior DECIMAL(10,2) DEFAULT 0,
    kilometers_exterior DECIMAL(10,2) DEFAULT 0,
    kilometers_equivalent DECIMAL(10,2) DEFAULT 0,
    
    -- Rest în rezervor la începutul zilei (litri)
    start_day_fuel_liters DECIMAL(10,2) DEFAULT 0,
    
    -- Alimentări
    liquid_fuel_added DECIMAL(10,2) DEFAULT 0,
    numeric_fuel DECIMAL(10,2) DEFAULT 0,
    bcf_fuel DECIMAL(10,2) DEFAULT 0,
    equivalent_liters DECIMAL(10,2) DEFAULT 0,
    
    -- Consum efectiv (calculat automat)
    actual_consumption_liters DECIMAL(10,2) DEFAULT 0,
    
    -- Consum normat (L/100km)
    standard_consumption_urban DECIMAL(5,2) DEFAULT 8.40,
    standard_consumption_extraurban DECIMAL(5,2) DEFAULT 6.30,
    
    -- Rest în rezervor la sfârșitul zilei (calculat automat)
    end_day_fuel_liters DECIMAL(10,2) DEFAULT 0,
    
    -- Preț și valoare
    price_per_liter DECIMAL(10,2) DEFAULT 0,
    total_value_lei DECIMAL(10,2) DEFAULT 0,
    
    -- Status
    status ENUM('DRAFT', 'COMPLETED') DEFAULT 'DRAFT',
    
    -- Observații
    notes TEXT,
    
    -- Utilizator
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
CREATE INDEX idx_daily_activity_date ON daily_activity_sheet(date);
CREATE INDEX idx_daily_activity_vehicle ON daily_activity_sheet(vehicle_id);
CREATE INDEX idx_daily_activity_driver ON daily_activity_sheet(driver_id);
