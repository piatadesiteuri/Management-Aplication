-- Sistem complet de trasabilitate pentru cereri și comenzi
-- Creează tabelele pentru audit complet al întregului proces

-- Tabel pentru audit-ul cererilor de materiale
CREATE TABLE IF NOT EXISTS material_request_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    action_type ENUM(
        'CREATED', 'UPDATED', 'APPROVED', 'REJECTED', 'CANCELLED', 
        'QUANTITY_CHANGED', 'PRIORITY_CHANGED', 'REASON_CHANGED',
        'ASSIGNED_TO_INSPECTOR', 'ESCALATED', 'DEADLINE_SET', 'DEADLINE_EXTENDED'
    ) NOT NULL,
    performed_by INT NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values JSON NULL,
    new_values JSON NULL,
    comments TEXT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    FOREIGN KEY (request_id) REFERENCES material_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_material_request_audit_request (request_id),
    INDEX idx_material_request_audit_action (action_type),
    INDEX idx_material_request_audit_performed_by (performed_by),
    INDEX idx_material_request_audit_performed_at (performed_at)
);

-- Tabel pentru audit-ul evenimentelor de transport
CREATE TABLE IF NOT EXISTS transport_event_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    action_type ENUM(
        'CREATED', 'UPDATED', 'STATUS_CHANGED', 'ASSIGNED', 'UNASSIGNED',
        'SUPPLIER_CHANGED', 'DELIVERY_DATE_CHANGED', 'QUANTITY_CHANGED',
        'PRICE_CHANGED', 'DELIVERED', 'CANCELLED', 'RESCHEDULED'
    ) NOT NULL,
    performed_by INT NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values JSON NULL,
    new_values JSON NULL,
    comments TEXT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_transport_event_audit_event (event_id),
    INDEX idx_transport_event_audit_action (action_type),
    INDEX idx_transport_event_audit_performed_by (performed_by),
    INDEX idx_transport_event_audit_performed_at (performed_at)
);

-- Tabel pentru audit-ul operațiunilor de stoc
CREATE TABLE IF NOT EXISTS stock_operation_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    operation_id INT NULL, -- poate fi event_stock_operations.id sau inventory.id
    operation_type ENUM(
        'STOCK_RECEIVED', 'STOCK_ISSUED', 'STOCK_MOVED', 'STOCK_ADJUSTED',
        'INVENTORY_COUNT', 'STOCK_TRANSFER', 'STOCK_RETURN', 'STOCK_DAMAGED'
    ) NOT NULL,
    entity_type ENUM('EVENT_STOCK', 'INVENTORY', 'SUPPLY_EVENT') NOT NULL,
    performed_by INT NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values JSON NULL,
    new_values JSON NULL,
    comments TEXT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_stock_operation_audit_operation (operation_id),
    INDEX idx_stock_operation_audit_type (operation_type),
    INDEX idx_stock_operation_audit_entity (entity_type),
    INDEX idx_stock_operation_audit_performed_by (performed_by),
    INDEX idx_stock_operation_audit_performed_at (performed_at)
);

-- Tabel pentru audit-ul aprobărilor
CREATE TABLE IF NOT EXISTS approval_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    approval_request_id INT NULL,
    event_id INT NULL,
    action_type ENUM(
        'APPROVAL_REQUESTED', 'APPROVAL_GRANTED', 'APPROVAL_DENIED',
        'APPROVAL_ESCALATED', 'APPROVAL_DELEGATED', 'APPROVAL_EXPIRED',
        'APPROVAL_CANCELLED', 'APPROVAL_REVISED'
    ) NOT NULL,
    performed_by INT NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values JSON NULL,
    new_values JSON NULL,
    comments TEXT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    FOREIGN KEY (approval_request_id) REFERENCES approval_requests(id) ON DELETE SET NULL,
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE SET NULL,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_approval_audit_request (approval_request_id),
    INDEX idx_approval_audit_event (event_id),
    INDEX idx_approval_audit_action (action_type),
    INDEX idx_approval_audit_performed_by (performed_by),
    INDEX idx_approval_audit_performed_at (performed_at)
);

-- Tabel pentru audit-ul notificărilor
CREATE TABLE IF NOT EXISTS notification_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notification_id INT NULL,
    action_type ENUM(
        'SENT', 'DELIVERED', 'READ', 'CLICKED', 'ARCHIVED', 'DELETED',
        'RESENT', 'ESCALATED', 'AUTO_GENERATED'
    ) NOT NULL,
    performed_by INT NULL, -- NULL pentru acțiuni automate
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values JSON NULL,
    new_values JSON NULL,
    comments TEXT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE SET NULL,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_notification_audit_notification (notification_id),
    INDEX idx_notification_audit_action (action_type),
    INDEX idx_notification_audit_performed_by (performed_by),
    INDEX idx_notification_audit_performed_at (performed_at)
);

-- Tabel pentru audit-ul documentelor
CREATE TABLE IF NOT EXISTS document_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NULL,
    action_type ENUM(
        'UPLOADED', 'DOWNLOADED', 'VIEWED', 'UPDATED', 'DELETED',
        'SHARED', 'APPROVED', 'REJECTED', 'ARCHIVED', 'RESTORED'
    ) NOT NULL,
    performed_by INT NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values JSON NULL,
    new_values JSON NULL,
    comments TEXT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_document_audit_document (document_id),
    INDEX idx_document_audit_action (action_type),
    INDEX idx_document_audit_performed_by (performed_by),
    INDEX idx_document_audit_performed_at (performed_at)
);

-- View pentru trasabilitatea completă a cererilor
CREATE OR REPLACE VIEW material_request_traceability AS
SELECT 
    mr.id as request_id,
    mr.request_number,
    mr.product_id,
    p.name as product_name,
    p.unit as product_unit,
    mr.quantity_requested,
    mr.quantity_approved,
    mr.priority,
    mr.status,
    mr.reason,
    mr.created_at as request_created_at,
    
    -- Solicitant
    requester.id as requester_id,
    requester.first_name as requester_first_name,
    requester.last_name as requester_last_name,
    requester.email as requester_email,
    
    -- Aprobator
    approver.id as approver_id,
    approver.first_name as approver_first_name,
    approver.last_name as approver_last_name,
    approver.email as approver_email,
    mr.approved_at,
    
    -- Respingător
    rejector.id as rejector_id,
    rejector.first_name as rejector_first_name,
    rejector.last_name as rejector_last_name,
    rejector.email as rejector_email,
    mr.rejected_at,
    mr.rejection_reason,
    
    -- Eveniment de transport creat
    ce.id as transport_event_id,
    ce.title as transport_event_title,
    ce.start_time as transport_event_start,
    ce.end_time as transport_event_end,
    ce.status as transport_event_status,
    
    -- Audit trail
    (SELECT COUNT(*) FROM material_request_audit mra WHERE mra.request_id = mr.id) as audit_entries_count,
    (SELECT MAX(mra.performed_at) FROM material_request_audit mra WHERE mra.request_id = mr.id) as last_audit_at
    
FROM material_requests mr
LEFT JOIN products p ON mr.product_id = p.id
LEFT JOIN users requester ON mr.requester_id = requester.id
LEFT JOIN users approver ON mr.approved_by = approver.id
LEFT JOIN users rejector ON mr.rejected_by = rejector.id
LEFT JOIN supply_events se ON mr.id = se.request_id
LEFT JOIN calendar_events ce ON se.event_id = ce.id;

-- View pentru trasabilitatea evenimentelor de transport
CREATE OR REPLACE VIEW transport_event_traceability AS
SELECT 
    ce.id as event_id,
    ce.title,
    ce.start_time,
    ce.end_time,
    ce.type as event_type,
    ce.status as event_status,
    ce.created_at as event_created_at,
    
    -- Creator
    creator.id as creator_id,
    creator.first_name as creator_first_name,
    creator.last_name as creator_last_name,
    creator.email as creator_email,
    
    -- Metadata
    ce.metadata,
    
    -- Cerere de materiale asociată
    mr.id as material_request_id,
    mr.request_number,
    p.name as product_name,
    mr.quantity_requested,
    mr.quantity_approved,
    
    -- Audit trail
    (SELECT COUNT(*) FROM transport_event_audit tea WHERE tea.event_id = ce.id) as audit_entries_count,
    (SELECT MAX(tea.performed_at) FROM transport_event_audit tea WHERE tea.event_id = ce.id) as last_audit_at
    
FROM calendar_events ce
LEFT JOIN users creator ON ce.user_id = creator.id
LEFT JOIN supply_events se ON ce.id = se.event_id
LEFT JOIN material_requests mr ON se.request_id = mr.id
WHERE ce.type IN ('TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP', 'SUPPLY_ORDER');

-- View pentru statistici de trasabilitate
CREATE OR REPLACE VIEW traceability_statistics AS
SELECT 
    'MATERIAL_REQUESTS' as entity_type,
    COUNT(*) as total_entities,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7_days,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as last_30_days
FROM material_requests

UNION ALL

SELECT 
    'TRANSPORT_EVENTS' as entity_type,
    COUNT(*) as total_entities,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as last_7_days,
    COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as last_30_days
FROM calendar_events 
WHERE type IN ('TRANSPORT_DELIVERY', 'TRANSPORT_PICKUP', 'SUPPLY_ORDER');
