-- Migrație pentru sistemul de aprobare workflow DSP
-- Creez tabelele necesare pentru gestionarea workflow-urilor de aprobare

-- Tabel pentru pașii de aprobare (workflow steps)
CREATE TABLE IF NOT EXISTS approval_steps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workflow_type VARCHAR(50) NOT NULL,
    step_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    required_role ENUM('SUPER_ADMIN', 'DEPARTMENT_ADMIN', 'MANAGER', 'INSPECTOR', 'OPERATOR', 'VIEWER') NOT NULL,
    step_order INT NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    auto_approve BOOLEAN DEFAULT FALSE,
    timeout_hours INT DEFAULT 48,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_workflow_step (workflow_type, step_id),
    INDEX idx_approval_steps_workflow (workflow_type),
    INDEX idx_approval_steps_order (step_order),
    INDEX idx_approval_steps_role (required_role)
);

-- Tabel pentru cererile de aprobare
CREATE TABLE IF NOT EXISTS approval_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    step_id VARCHAR(100) NOT NULL,
    workflow_type VARCHAR(50) NOT NULL,
    requester_id INT NOT NULL,
    approver_id INT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'TIMEOUT', 'CANCELLED') DEFAULT 'PENDING',
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    deadline TIMESTAMP NULL,
    comments TEXT,
    rejection_reason ENUM('INCOMPLETE_DOCUMENTATION', 'INVALID_PROCEDURE', 'MISSING_APPROVALS', 'POLICY_VIOLATION', 'RESOURCE_UNAVAILABLE', 'OTHER') NULL,
    escalated_to INT NULL,
    escalated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (escalated_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_approval_requests_event (event_id),
    INDEX idx_approval_requests_step (step_id),
    INDEX idx_approval_requests_status (status),
    INDEX idx_approval_requests_priority (priority),
    INDEX idx_approval_requests_requester (requester_id),
    INDEX idx_approval_requests_approver (approver_id),
    INDEX idx_approval_requests_deadline (deadline)
);

-- Tabel pentru istoricul aprobărilor
CREATE TABLE IF NOT EXISTS approval_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    request_id INT NULL,
    action ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'ESCALATED', 'CANCELLED', 'TIMEOUT') NOT NULL,
    performed_by INT NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
    from_status VARCHAR(50) NULL,
    to_status VARCHAR(50) NULL,
    step_name VARCHAR(255) NULL,
    metadata JSON NULL,
    
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (request_id) REFERENCES approval_requests(id) ON DELETE SET NULL,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_approval_history_event (event_id),
    INDEX idx_approval_history_request (request_id),
    INDEX idx_approval_history_action (action),
    INDEX idx_approval_history_performed_by (performed_by),
    INDEX idx_approval_history_performed_at (performed_at)
);

-- Tabel pentru configurarea workflow-urilor
CREATE TABLE IF NOT EXISTS workflow_configurations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workflow_type VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    auto_start BOOLEAN DEFAULT FALSE,
    requires_all_steps BOOLEAN DEFAULT TRUE,
    allow_parallel_approval BOOLEAN DEFAULT FALSE,
    escalation_enabled BOOLEAN DEFAULT TRUE,
    timeout_action ENUM('AUTO_APPROVE', 'AUTO_REJECT', 'ESCALATE', 'NOTIFY') DEFAULT 'ESCALATE',
    notification_settings JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_workflow_configurations_type (workflow_type),
    INDEX idx_workflow_configurations_active (is_active)
);

-- Tabel pentru notificările de aprobare
CREATE TABLE IF NOT EXISTS approval_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    user_id INT NOT NULL,
    notification_type ENUM('APPROVAL_REQUEST', 'APPROVAL_REMINDER', 'APPROVAL_GRANTED', 'APPROVAL_DENIED', 'ESCALATION', 'TIMEOUT_WARNING') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP NULL,
    delivery_method ENUM('EMAIL', 'SYSTEM', 'BOTH') DEFAULT 'BOTH',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES approval_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_approval_notifications_request (request_id),
    INDEX idx_approval_notifications_user (user_id),
    INDEX idx_approval_notifications_type (notification_type),
    INDEX idx_approval_notifications_read (is_read),
    INDEX idx_approval_notifications_sent (sent_at)
);

-- Inserez configurațiile workflow-urilor DSP
INSERT INTO workflow_configurations (workflow_type, name, description, is_active, auto_start, requires_all_steps, allow_parallel_approval, escalation_enabled, timeout_action) VALUES
('INSPECTION', 'Workflow Inspecție', 'Workflow pentru aprobarea inspecțiilor sanitare', TRUE, TRUE, TRUE, FALSE, TRUE, 'ESCALATE'),
('HEALTH_EMERGENCY', 'Workflow Urgență Sanitară', 'Workflow accelerat pentru urgențe sanitare', TRUE, TRUE, TRUE, FALSE, TRUE, 'ESCALATE'),
('EPIDEMIOLOGICAL_CONTROL', 'Workflow Control Epidemiologic', 'Workflow pentru controlul epidemiologic', TRUE, TRUE, TRUE, FALSE, TRUE, 'ESCALATE'),
('ADMINISTRATIVE', 'Workflow Administrativ', 'Workflow pentru activități administrative', TRUE, FALSE, FALSE, TRUE, FALSE, 'AUTO_APPROVE'),
('DEFAULT', 'Workflow Standard', 'Workflow implicit pentru alte tipuri de evenimente', TRUE, FALSE, TRUE, FALSE, TRUE, 'ESCALATE')
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    updated_at = CURRENT_TIMESTAMP;

-- Inserez pașii de aprobare pentru fiecare workflow
INSERT INTO approval_steps (workflow_type, step_id, name, description, required_role, step_order, is_required, auto_approve, timeout_hours) VALUES
-- Workflow Inspecție
('INSPECTION', 'inspector-review', 'Verificare Inspector', 'Verificarea detaliilor inspecției de către inspector responsabil', 'INSPECTOR', 1, TRUE, FALSE, 24),
('INSPECTION', 'manager-approval', 'Aprobare Manager', 'Aprobare de către managerul de departament', 'MANAGER', 2, TRUE, FALSE, 48),
('INSPECTION', 'department-admin-approval', 'Aprobare Șef Departament', 'Aprobare finală de către șeful de departament', 'DEPARTMENT_ADMIN', 3, TRUE, FALSE, 72),

-- Workflow Urgență Sanitară
('HEALTH_EMERGENCY', 'immediate-review', 'Verificare Imediată', 'Verificare urgentă pentru situații de urgență sanitară', 'MANAGER', 1, TRUE, FALSE, 2),
('HEALTH_EMERGENCY', 'department-admin-urgent', 'Aprobare Urgentă', 'Aprobare urgentă de către șeful de departament', 'DEPARTMENT_ADMIN', 2, TRUE, FALSE, 4),

-- Workflow Control Epidemiologic
('EPIDEMIOLOGICAL_CONTROL', 'epidemiologist-review', 'Verificare Epidemiolog', 'Verificarea protocolului epidemiologic', 'INSPECTOR', 1, TRUE, FALSE, 12),
('EPIDEMIOLOGICAL_CONTROL', 'department-admin-epi', 'Aprobare Epidemiologică', 'Aprobare pentru controlul epidemiologic', 'DEPARTMENT_ADMIN', 2, TRUE, FALSE, 24),

-- Workflow Administrativ
('ADMINISTRATIVE', 'manager-admin-review', 'Verificare Manager', 'Verificarea activității administrative', 'MANAGER', 1, FALSE, TRUE, 24),

-- Workflow Standard
('DEFAULT', 'standard-review', 'Verificare Standard', 'Verificarea standard pentru evenimente obișnuite', 'MANAGER', 1, TRUE, FALSE, 48)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    description = VALUES(description),
    required_role = VALUES(required_role),
    step_order = VALUES(step_order),
    is_required = VALUES(is_required),
    auto_approve = VALUES(auto_approve),
    timeout_hours = VALUES(timeout_hours),
    updated_at = CURRENT_TIMESTAMP;

-- Adaug coloane noi la tabela calendar_events pentru workflow
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS workflow_type VARCHAR(50) DEFAULT 'DEFAULT',
ADD COLUMN IF NOT EXISTS workflow_status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED') DEFAULT 'NOT_STARTED',
ADD COLUMN IF NOT EXISTS current_step_id VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS workflow_started_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS workflow_completed_at TIMESTAMP NULL;

-- Adaug indexuri pentru noile coloane
CREATE INDEX IF NOT EXISTS idx_calendar_events_workflow_type ON calendar_events(workflow_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_workflow_status ON calendar_events(workflow_status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_current_step ON calendar_events(current_step_id);

-- Actualizez evenimentele existente cu workflow-ul corespunzător
UPDATE calendar_events 
SET workflow_type = CASE 
    WHEN type = 'INSPECTION' THEN 'INSPECTION'
    WHEN type = 'HEALTH_EMERGENCY' THEN 'HEALTH_EMERGENCY'
    WHEN type = 'EPIDEMIOLOGICAL_CONTROL' THEN 'EPIDEMIOLOGICAL_CONTROL'
    WHEN type = 'ADMINISTRATIVE' THEN 'ADMINISTRATIVE'
    ELSE 'DEFAULT'
END
WHERE workflow_type = 'DEFAULT';

-- Trigger pentru actualizarea automată a workflow-ului când se schimbă tipul evenimentului
DELIMITER //
CREATE TRIGGER IF NOT EXISTS update_workflow_type_on_event_type_change
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
BEGIN
    IF OLD.type != NEW.type THEN
        SET NEW.workflow_type = CASE 
            WHEN NEW.type = 'INSPECTION' THEN 'INSPECTION'
            WHEN NEW.type = 'HEALTH_EMERGENCY' THEN 'HEALTH_EMERGENCY'
            WHEN NEW.type = 'EPIDEMIOLOGICAL_CONTROL' THEN 'EPIDEMIOLOGICAL_CONTROL'
            WHEN NEW.type = 'ADMINISTRATIVE' THEN 'ADMINISTRATIVE'
            ELSE 'DEFAULT'
        END;
        SET NEW.workflow_status = 'NOT_STARTED';
        SET NEW.current_step_id = NULL;
        SET NEW.workflow_started_at = NULL;
        SET NEW.workflow_completed_at = NULL;
    END IF;
END//
DELIMITER ;

-- Procedură pentru inițializarea workflow-ului
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS InitializeEventWorkflow(
    IN p_event_id INT,
    IN p_workflow_type VARCHAR(50),
    IN p_requester_id INT
)
BEGIN
    DECLARE v_first_step_id VARCHAR(100);
    DECLARE v_first_step_role VARCHAR(50);
    DECLARE v_timeout_hours INT;
    DECLARE v_deadline TIMESTAMP;
    
    -- Găsesc primul pas al workflow-ului
    SELECT step_id, required_role, timeout_hours 
    INTO v_first_step_id, v_first_step_role, v_timeout_hours
    FROM approval_steps 
    WHERE workflow_type = p_workflow_type 
    ORDER BY step_order ASC 
    LIMIT 1;
    
    IF v_first_step_id IS NOT NULL THEN
        -- Calculez deadline-ul
        SET v_deadline = DATE_ADD(NOW(), INTERVAL v_timeout_hours HOUR);
        
        -- Actualizez evenimentul
        UPDATE calendar_events 
        SET workflow_status = 'IN_PROGRESS',
            current_step_id = v_first_step_id,
            workflow_started_at = NOW()
        WHERE id = p_event_id;
        
        -- Creez cererea de aprobare
        INSERT INTO approval_requests (
            event_id, step_id, workflow_type, requester_id, 
            deadline, created_at
        ) VALUES (
            p_event_id, v_first_step_id, p_workflow_type, p_requester_id,
            v_deadline, NOW()
        );
        
        -- Adaug în istoric
        INSERT INTO approval_history (
            event_id, action, performed_by, step_name
        ) VALUES (
            p_event_id, 'SUBMITTED', p_requester_id, 
            (SELECT name FROM approval_steps WHERE step_id = v_first_step_id AND workflow_type = p_workflow_type)
        );
    END IF;
END//
DELIMITER ;

-- Procedură pentru procesarea unei aprobări
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS ProcessApprovalAction(
    IN p_request_id INT,
    IN p_action ENUM('APPROVED', 'REJECTED', 'ESCALATED'),
    IN p_performed_by INT,
    IN p_comments TEXT,
    IN p_rejection_reason VARCHAR(100),
    IN p_escalated_to INT
)
BEGIN
    DECLARE v_event_id INT;
    DECLARE v_step_id VARCHAR(100);
    DECLARE v_workflow_type VARCHAR(50);
    DECLARE v_current_order INT;
    DECLARE v_next_step_id VARCHAR(100);
    DECLARE v_next_step_role VARCHAR(50);
    DECLARE v_next_timeout_hours INT;
    DECLARE v_next_deadline TIMESTAMP;
    DECLARE v_step_name VARCHAR(255);
    
    -- Obțin informațiile cererii
    SELECT ar.event_id, ar.step_id, ar.workflow_type, aps.step_order, aps.name
    INTO v_event_id, v_step_id, v_workflow_type, v_current_order, v_step_name
    FROM approval_requests ar
    JOIN approval_steps aps ON ar.step_id = aps.step_id AND ar.workflow_type = aps.workflow_type
    WHERE ar.id = p_request_id;
    
    -- Actualizez cererea
    UPDATE approval_requests 
    SET status = p_action,
        approver_id = p_performed_by,
        responded_at = NOW(),
        comments = p_comments,
        rejection_reason = p_rejection_reason,
        escalated_to = p_escalated_to,
        escalated_at = CASE WHEN p_action = 'ESCALATED' THEN NOW() ELSE NULL END
    WHERE id = p_request_id;
    
    -- Adaug în istoric
    INSERT INTO approval_history (
        event_id, request_id, action, performed_by, comments, step_name
    ) VALUES (
        v_event_id, p_request_id, p_action, p_performed_by, p_comments, v_step_name
    );
    
    IF p_action = 'APPROVED' THEN
        -- Găsesc următorul pas
        SELECT step_id, required_role, timeout_hours
        INTO v_next_step_id, v_next_step_role, v_next_timeout_hours
        FROM approval_steps 
        WHERE workflow_type = v_workflow_type 
        AND step_order = v_current_order + 1
        LIMIT 1;
        
        IF v_next_step_id IS NOT NULL THEN
            -- Există următorul pas
            SET v_next_deadline = DATE_ADD(NOW(), INTERVAL v_next_timeout_hours HOUR);
            
            UPDATE calendar_events 
            SET current_step_id = v_next_step_id
            WHERE id = v_event_id;
            
            INSERT INTO approval_requests (
                event_id, step_id, workflow_type, requester_id, deadline
            ) VALUES (
                v_event_id, v_next_step_id, v_workflow_type, p_performed_by, v_next_deadline
            );
        ELSE
            -- Workflow complet
            UPDATE calendar_events 
            SET workflow_status = 'COMPLETED',
                current_step_id = NULL,
                workflow_completed_at = NOW(),
                approval_status = 'APPROVED'
            WHERE id = v_event_id;
        END IF;
    ELSEIF p_action = 'REJECTED' THEN
        -- Workflow respins
        UPDATE calendar_events 
        SET workflow_status = 'FAILED',
            current_step_id = NULL,
            approval_status = 'REJECTED'
        WHERE id = v_event_id;
    END IF;
END//
DELIMITER ; 