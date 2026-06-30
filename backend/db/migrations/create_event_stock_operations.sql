-- Migration: Create Event Stock Operations tables
-- Date: 2024-01-02
-- Description: Tables for managing stock operations through calendar events

-- Tabelă pentru operațiunile de stoc legate de evenimente
CREATE TABLE IF NOT EXISTS event_stock_operations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    product_id INT NOT NULL,
    operation_type ENUM('RECEPTION', 'DISTRIBUTION', 'MOVEMENT', 'AUDIT') NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    from_location VARCHAR(100) DEFAULT NULL,
    to_location VARCHAR(100) DEFAULT NULL,
    supplier_id INT DEFAULT NULL,
    department_id INT DEFAULT NULL,
    status ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PLANNED',
    notes TEXT DEFAULT NULL,
    created_by INT DEFAULT NULL,
    processed_by INT DEFAULT NULL,
    processed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_event_stock_event (event_id),
    INDEX idx_event_stock_product (product_id),
    INDEX idx_event_stock_status (status),
    INDEX idx_event_stock_operation (operation_type),
    INDEX idx_event_stock_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabelă pentru istoricul mișcărilor de stoc generate de evenimente
CREATE TABLE IF NOT EXISTS event_stock_movements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_stock_operation_id INT NOT NULL,
    stock_movement_id INT DEFAULT NULL,
    inventory_id INT NOT NULL,
    movement_type ENUM('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER') NOT NULL,
    quantity_before DECIMAL(10,3) NOT NULL,
    quantity_after DECIMAL(10,3) NOT NULL,
    quantity_changed DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2) DEFAULT 0.00,
    reference_document VARCHAR(255) DEFAULT NULL,
    performed_by INT DEFAULT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_stock_operation_id) REFERENCES event_stock_operations(id) ON DELETE CASCADE,
    FOREIGN KEY (stock_movement_id) REFERENCES stock_movements(id) ON DELETE SET NULL,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE RESTRICT,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_event_stock_movement_operation (event_stock_operation_id),
    INDEX idx_event_stock_movement_inventory (inventory_id),
    INDEX idx_event_stock_movement_type (movement_type),
    INDEX idx_event_stock_movement_performed (performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabelă pentru template-uri de operațiuni de stoc
CREATE TABLE IF NOT EXISTS event_stock_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    event_type ENUM('STOCK_RECEPTION', 'STOCK_DISTRIBUTION', 'STOCK_MOVEMENT', 'INVENTORY_AUDIT') NOT NULL,
    department_id INT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_event_stock_template_type (event_type),
    INDEX idx_event_stock_template_dept (department_id),
    INDEX idx_event_stock_template_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabelă pentru itemii din template-urile de operațiuni de stoc
CREATE TABLE IF NOT EXISTS event_stock_template_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NOT NULL,
    product_id INT NOT NULL,
    default_quantity DECIMAL(10,3) DEFAULT 1.000,
    default_unit_cost DECIMAL(10,2) DEFAULT 0.00,
    from_location VARCHAR(100) DEFAULT NULL,
    to_location VARCHAR(100) DEFAULT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    notes TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (template_id) REFERENCES event_stock_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    INDEX idx_event_stock_template_item_template (template_id),
    INDEX idx_event_stock_template_item_product (product_id),
    INDEX idx_event_stock_template_item_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserare template-uri default
INSERT INTO event_stock_templates (name, description, event_type, created_by) VALUES
('Primire Marfă Standard', 'Template standard pentru primirea mărfurilor de la furnizori', 'STOCK_RECEPTION', 1),
('Distribuire Departament Epidemiologie', 'Distribuire materiale către Departamentul de Epidemiologie', 'STOCK_DISTRIBUTION', 1),
('Transfer Depozit Principal → Depozit A', 'Transfer produse între depozite', 'STOCK_MOVEMENT', 1),
('Inventariere Lunară', 'Template pentru inventarierea lunară', 'INVENTORY_AUDIT', 1);

-- Adăugare constrainte pentru validarea datelor
ALTER TABLE event_stock_operations 
ADD CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
ADD CONSTRAINT chk_unit_cost_non_negative CHECK (unit_cost >= 0);

ALTER TABLE event_stock_movements 
ADD CONSTRAINT chk_quantity_before_non_negative CHECK (quantity_before >= 0),
ADD CONSTRAINT chk_quantity_after_non_negative CHECK (quantity_after >= 0);

ALTER TABLE event_stock_template_items 
ADD CONSTRAINT chk_default_quantity_positive CHECK (default_quantity > 0),
ADD CONSTRAINT chk_default_unit_cost_non_negative CHECK (default_unit_cost >= 0); 