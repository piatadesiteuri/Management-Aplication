-- Material Requests System
-- Creez tabela pentru cererile de materiale

CREATE TABLE IF NOT EXISTS material_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_number VARCHAR(100) UNIQUE NOT NULL,
    product_id INT NOT NULL,
    supplier_id INT NOT NULL,
    requester_id INT NOT NULL,
    quantity_requested INT NOT NULL,
    quantity_approved INT DEFAULT 0,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED') DEFAULT 'PENDING',
    reason TEXT,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    rejected_by INT,
    rejected_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_material_requests_product (product_id),
    INDEX idx_material_requests_supplier (supplier_id),
    INDEX idx_material_requests_requester (requester_id),
    INDEX idx_material_requests_status (status),
    INDEX idx_material_requests_priority (priority),
    INDEX idx_material_requests_created (created_at)
);

-- Tabel pentru evenimentele de aprovizionare create din cereri
CREATE TABLE IF NOT EXISTS supply_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    event_id INT NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES material_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_request_event (request_id, event_id),
    INDEX idx_supply_events_request (request_id),
    INDEX idx_supply_events_event (event_id)
);

-- Trigger pentru generarea automată a numărului de cerere
DELIMITER //
CREATE TRIGGER generate_request_number
    BEFORE INSERT ON material_requests
    FOR EACH ROW
BEGIN
    IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
        SET NEW.request_number = CONCAT('MR-', YEAR(NOW()), '-', LPAD(LAST_INSERT_ID(), 6, '0'));
    END IF;
END//
DELIMITER ;

-- View pentru cererile de materiale cu detalii complete
CREATE VIEW material_requests_details AS
SELECT 
    mr.id,
    mr.request_number,
    mr.quantity_requested,
    mr.quantity_approved,
    mr.priority,
    mr.status,
    mr.reason,
    mr.created_at,
    mr.updated_at,
    
    -- Detalii produs
    p.name as product_name,
    p.code as product_code,
    p.unit as product_unit,
    p.min_stock,
    p.max_stock,
    
    -- Detalii furnizor
    s.name as supplier_name,
    s.contact_person as supplier_contact,
    s.email as supplier_email,
    s.phone as supplier_phone,
    
    -- Detalii solicitant
    u.first_name as requester_first_name,
    u.last_name as requester_last_name,
    u.email as requester_email,
    u.role as requester_role,
    
    -- Detalii aprobator
    approver.first_name as approver_first_name,
    approver.last_name as approver_last_name,
    approver.email as approver_email,
    
    -- Detalii respingător
    rejector.first_name as rejector_first_name,
    rejector.last_name as rejector_last_name,
    rejector.email as rejector_email
    
FROM material_requests mr
LEFT JOIN products p ON mr.product_id = p.id
LEFT JOIN suppliers s ON mr.supplier_id = s.id
LEFT JOIN users u ON mr.requester_id = u.id
LEFT JOIN users approver ON mr.approved_by = approver.id
LEFT JOIN users rejector ON mr.rejected_by = rejector.id;
