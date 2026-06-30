-- Creare tabelă pentru legătura evenimente-produse
CREATE TABLE IF NOT EXISTS event_supplies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity_needed DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity_allocated DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity_used DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity_needed * unit_cost) STORED,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    status ENUM('PENDING', 'APPROVED', 'ALLOCATED', 'DELIVERED', 'USED', 'RETURNED') DEFAULT 'PENDING',
    notes TEXT,
    requested_by INT,
    approved_by INT,
    allocated_by INT,
    delivered_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (allocated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_event_product (event_id, product_id),
    INDEX idx_event_supplies_event (event_id),
    INDEX idx_event_supplies_product (product_id),
    INDEX idx_event_supplies_status (status),
    INDEX idx_event_supplies_priority (priority)
);

-- Tabelă pentru istoricul utilizării materialelor la evenimente
CREATE TABLE IF NOT EXISTS event_supply_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_supply_id INT NOT NULL,
    action ENUM('REQUESTED', 'APPROVED', 'ALLOCATED', 'DELIVERED', 'USED', 'RETURNED', 'CANCELLED') NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 0,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    notes TEXT,
    performed_by INT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_supply_id) REFERENCES event_supplies(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_event_supply_history_supply (event_supply_id),
    INDEX idx_event_supply_history_action (action),
    INDEX idx_event_supply_history_date (performed_at)
);

-- Tabelă pentru template-uri de materiale pentru tipuri de evenimente
CREATE TABLE IF NOT EXISTS event_supply_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_event_supply_templates_type (event_type),
    INDEX idx_event_supply_templates_active (is_active)
);

-- Tabelă pentru articolele din template-uri
CREATE TABLE IF NOT EXISTS event_supply_template_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    product_id INT NOT NULL,
    default_quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    is_required BOOLEAN DEFAULT FALSE,
    notes TEXT,
    
    FOREIGN KEY (template_id) REFERENCES event_supply_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_template_product (template_id, product_id),
    INDEX idx_template_items_template (template_id),
    INDEX idx_template_items_product (product_id),
    INDEX idx_template_items_priority (priority)
);

-- Inserez câteva template-uri de bază
INSERT INTO event_supply_templates (name, description, event_type, created_by) VALUES
('Inspecție Standard', 'Materiale necesare pentru o inspecție standard DSP', 'Inspecție', 1),
('Intervenție Urgență', 'Materiale pentru intervenții de urgență sanitară', 'Urgență', 1),
('Control Epidemiologic', 'Materiale pentru controale epidemiologice', 'Control', 1),
('Vaccinare Campanie', 'Materiale pentru campaniile de vaccinare', 'Vaccinare', 1); 