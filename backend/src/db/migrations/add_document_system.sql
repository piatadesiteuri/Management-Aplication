-- Migration: Add Document Management System for DSP
-- Description: Comprehensive document storage and management for calendar events

-- Create event_documents table
CREATE TABLE IF NOT EXISTS event_documents (
    id VARCHAR(36) PRIMARY KEY,
    event_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    category ENUM('INSPECTION_REPORT', 'PROTOCOL', 'CERTIFICATE', 'PHOTO', 'FORM', 'OTHER') DEFAULT 'OTHER',
    is_public BOOLEAN DEFAULT FALSE,
    description TEXT,
    tags JSON,
    version INT DEFAULT 1,
    parent_document_id VARCHAR(36),
    checksum VARCHAR(64) NOT NULL,
    approval_status ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') DEFAULT 'DRAFT',
    approved_by INT,
    approved_at TIMESTAMP NULL,
    approval_comments TEXT,
    expires_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by INT,
    
    -- Foreign keys
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_document_id) REFERENCES event_documents(id) ON DELETE SET NULL,
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_event_documents_event_id (event_id),
    INDEX idx_event_documents_uploaded_by (uploaded_by),
    INDEX idx_event_documents_category (category),
    INDEX idx_event_documents_approval_status (approval_status),
    INDEX idx_event_documents_uploaded_at (uploaded_at),
    INDEX idx_event_documents_checksum (checksum),
    INDEX idx_event_documents_is_deleted (is_deleted),
    
    -- Full-text search index
    FULLTEXT(original_name, description)
);

-- Create document_versions table for version control
CREATE TABLE IF NOT EXISTS document_versions (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    version INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    checksum VARCHAR(64),
    
    -- Foreign keys
    FOREIGN KEY (document_id) REFERENCES event_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_document_versions_document_id (document_id),
    INDEX idx_document_versions_version (version),
    INDEX idx_document_versions_uploaded_at (uploaded_at),
    INDEX idx_document_versions_is_active (is_active),
    
    -- Unique constraint for active versions
    UNIQUE KEY uk_document_active_version (document_id, is_active)
);

-- Create document_access_log table for audit trail
CREATE TABLE IF NOT EXISTS document_access_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    accessed_by INT NOT NULL,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action ENUM('VIEW', 'DOWNLOAD', 'EDIT', 'DELETE', 'APPROVE', 'REJECT') NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSON,
    
    -- Foreign keys
    FOREIGN KEY (document_id) REFERENCES event_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (accessed_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_document_access_log_document_id (document_id),
    INDEX idx_document_access_log_accessed_by (accessed_by),
    INDEX idx_document_access_log_accessed_at (accessed_at),
    INDEX idx_document_access_log_action (action)
);

-- Create document_categories table for DSP-specific categories
CREATE TABLE IF NOT EXISTS document_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    max_file_size BIGINT DEFAULT 10485760, -- 10MB default
    allowed_mime_types JSON,
    retention_days INT, -- Document retention policy
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_document_categories_is_active (is_active)
);

-- Create document_templates table for standardized documents
CREATE TABLE IF NOT EXISTS document_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INT,
    template_file VARCHAR(255),
    fields JSON, -- Form fields configuration
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (category_id) REFERENCES document_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes
    INDEX idx_document_templates_category_id (category_id),
    INDEX idx_document_templates_is_active (is_active)
);

-- Create document_shares table for sharing documents
CREATE TABLE IF NOT EXISTS document_shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    shared_by INT NOT NULL,
    shared_with INT,
    shared_with_role ENUM('INSPECTOR', 'MANAGER', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN'),
    shared_with_department INT,
    permissions JSON, -- View, download, edit permissions
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (document_id) REFERENCES event_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (shared_with) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_department) REFERENCES departments(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_document_shares_document_id (document_id),
    INDEX idx_document_shares_shared_with (shared_with),
    INDEX idx_document_shares_shared_with_role (shared_with_role),
    INDEX idx_document_shares_shared_with_department (shared_with_department),
    INDEX idx_document_shares_expires_at (expires_at),
    INDEX idx_document_shares_is_active (is_active)
);

-- Create document_comments table for document discussions
CREATE TABLE IF NOT EXISTS document_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    parent_comment_id INT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (document_id) REFERENCES event_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_comment_id) REFERENCES document_comments(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_document_comments_document_id (document_id),
    INDEX idx_document_comments_user_id (user_id),
    INDEX idx_document_comments_parent_comment_id (parent_comment_id),
    INDEX idx_document_comments_created_at (created_at),
    INDEX idx_document_comments_is_resolved (is_resolved)
);

-- Insert default document categories for DSP
INSERT INTO document_categories (name, description, icon, color, requires_approval, allowed_mime_types, retention_days) VALUES
('Raport Inspecție', 'Rapoarte de inspecție sanitară', 'FiFileText', '#3182ce', TRUE, '["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]', 2555), -- 7 years
('Protocol', 'Protocoale oficiale', 'FiShield', '#805ad5', TRUE, '["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]', 3650), -- 10 years
('Certificat', 'Certificate și autorizații', 'FiAward', '#38a169', TRUE, '["application/pdf", "image/jpeg", "image/png"]', 1825), -- 5 years
('Fotografie', 'Fotografii din inspecții', 'FiCamera', '#ed8936', FALSE, '["image/jpeg", "image/png", "image/gif"]', 1095), -- 3 years
('Formular', 'Formulare completate', 'FiEdit', '#319795', FALSE, '["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"]', 1460), -- 4 years
('Document General', 'Alte documente', 'FiFile', '#718096', FALSE, '["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]', 1095); -- 3 years

-- Insert default document templates
INSERT INTO document_templates (name, description, category_id, fields, created_by) VALUES
('Raport Inspecție Standard', 'Template standard pentru rapoarte de inspecție', 1, '{"fields": [{"name": "location", "type": "text", "required": true}, {"name": "inspector", "type": "text", "required": true}, {"name": "findings", "type": "textarea", "required": true}, {"name": "recommendations", "type": "textarea", "required": false}]}', 1),
('Protocol Neconformitate', 'Template pentru protocoale de neconformitate', 2, '{"fields": [{"name": "violation_type", "type": "select", "required": true}, {"name": "severity", "type": "select", "required": true}, {"name": "corrective_actions", "type": "textarea", "required": true}]}', 1),
('Formular Evaluare', 'Template pentru formulare de evaluare', 5, '{"fields": [{"name": "evaluation_date", "type": "date", "required": true}, {"name": "evaluator", "type": "text", "required": true}, {"name": "score", "type": "number", "required": true}, {"name": "comments", "type": "textarea", "required": false}]}', 1);

-- Create stored procedures for document management

DELIMITER //

-- Procedure to clean up expired documents
CREATE PROCEDURE CleanupExpiredDocuments()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE doc_id VARCHAR(36);
    DECLARE doc_filename VARCHAR(255);
    
    DECLARE cur CURSOR FOR 
        SELECT id, filename 
        FROM event_documents 
        WHERE expires_at IS NOT NULL 
        AND expires_at < NOW() 
        AND is_deleted = FALSE;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO doc_id, doc_filename;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Mark document as deleted
        UPDATE event_documents 
        SET is_deleted = TRUE, deleted_at = NOW() 
        WHERE id = doc_id;
        
        -- Log the cleanup action
        INSERT INTO document_access_log (document_id, accessed_by, action, details)
        VALUES (doc_id, 1, 'DELETE', JSON_OBJECT('reason', 'expired', 'automated', TRUE));
        
    END LOOP;
    
    CLOSE cur;
END//

-- Procedure to get document statistics
CREATE PROCEDURE GetDocumentStatistics(IN p_date_from DATE, IN p_date_to DATE)
BEGIN
    SELECT 
        COUNT(*) as total_documents,
        SUM(size) as total_size,
        COUNT(CASE WHEN approval_status = 'APPROVED' THEN 1 END) as approved_documents,
        COUNT(CASE WHEN approval_status = 'PENDING' THEN 1 END) as pending_documents,
        COUNT(CASE WHEN approval_status = 'REJECTED' THEN 1 END) as rejected_documents,
        COUNT(CASE WHEN category = 'INSPECTION_REPORT' THEN 1 END) as inspection_reports,
        COUNT(CASE WHEN category = 'PROTOCOL' THEN 1 END) as protocols,
        COUNT(CASE WHEN category = 'CERTIFICATE' THEN 1 END) as certificates,
        COUNT(CASE WHEN category = 'PHOTO' THEN 1 END) as photos,
        COUNT(CASE WHEN is_public = TRUE THEN 1 END) as public_documents,
        AVG(size) as average_size
    FROM event_documents
    WHERE uploaded_at BETWEEN p_date_from AND p_date_to
    AND is_deleted = FALSE;
END//

-- Procedure to archive old documents
CREATE PROCEDURE ArchiveOldDocuments(IN p_days_old INT)
BEGIN
    DECLARE archive_date DATE;
    SET archive_date = DATE_SUB(CURDATE(), INTERVAL p_days_old DAY);
    
    -- Create archive table if it doesn't exist
    CREATE TABLE IF NOT EXISTS event_documents_archive LIKE event_documents;
    
    -- Move old documents to archive
    INSERT INTO event_documents_archive 
    SELECT * FROM event_documents 
    WHERE uploaded_at < archive_date 
    AND is_deleted = FALSE;
    
    -- Mark original documents as archived
    UPDATE event_documents 
    SET is_deleted = TRUE, deleted_at = NOW() 
    WHERE uploaded_at < archive_date 
    AND is_deleted = FALSE;
    
    -- Log archival
    INSERT INTO document_access_log (document_id, accessed_by, action, details)
    SELECT id, 1, 'DELETE', JSON_OBJECT('reason', 'archived', 'automated', TRUE, 'archive_date', archive_date)
    FROM event_documents 
    WHERE uploaded_at < archive_date 
    AND deleted_at = NOW();
END//

DELIMITER ;

-- Create triggers for document management

-- Trigger to update document count in calendar_events
DELIMITER //
CREATE TRIGGER update_event_document_count_after_insert
    AFTER INSERT ON event_documents
    FOR EACH ROW
BEGIN
    UPDATE calendar_events 
    SET documents_count = (
        SELECT COUNT(*) 
        FROM event_documents 
        WHERE event_id = NEW.event_id 
        AND is_deleted = FALSE
    )
    WHERE id = NEW.event_id;
END//

CREATE TRIGGER update_event_document_count_after_delete
    AFTER UPDATE ON event_documents
    FOR EACH ROW
BEGIN
    IF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
        UPDATE calendar_events 
        SET documents_count = (
            SELECT COUNT(*) 
            FROM event_documents 
            WHERE event_id = NEW.event_id 
            AND is_deleted = FALSE
        )
        WHERE id = NEW.event_id;
    END IF;
END//

-- Trigger to log document changes
CREATE TRIGGER log_document_changes
    AFTER UPDATE ON event_documents
    FOR EACH ROW
BEGIN
    IF OLD.approval_status != NEW.approval_status THEN
        INSERT INTO document_access_log (document_id, accessed_by, action, details)
        VALUES (NEW.id, NEW.approved_by, 'APPROVE', 
                JSON_OBJECT('old_status', OLD.approval_status, 'new_status', NEW.approval_status));
    END IF;
END//

DELIMITER ;

-- Add documents_count column to calendar_events if it doesn't exist
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS documents_count INT DEFAULT 0;

-- Update existing events with document counts
UPDATE calendar_events e
SET documents_count = (
    SELECT COUNT(*) 
    FROM event_documents d 
    WHERE d.event_id = e.id 
    AND d.is_deleted = FALSE
);

-- Create indexes for performance
CREATE INDEX idx_calendar_events_documents_count ON calendar_events(documents_count);

-- Create view for document statistics
CREATE OR REPLACE VIEW document_statistics AS
SELECT 
    DATE(uploaded_at) as date,
    category,
    COUNT(*) as count,
    SUM(size) as total_size,
    AVG(size) as avg_size,
    COUNT(CASE WHEN approval_status = 'APPROVED' THEN 1 END) as approved_count,
    COUNT(CASE WHEN approval_status = 'PENDING' THEN 1 END) as pending_count,
    COUNT(CASE WHEN approval_status = 'REJECTED' THEN 1 END) as rejected_count
FROM event_documents
WHERE is_deleted = FALSE
GROUP BY DATE(uploaded_at), category
ORDER BY date DESC, category;

-- Create view for user document activity
CREATE OR REPLACE VIEW user_document_activity AS
SELECT 
    u.id as user_id,
    CONCAT(u.first_name, ' ', u.last_name) as user_name,
    u.email,
    COUNT(d.id) as documents_uploaded,
    SUM(d.size) as total_size_uploaded,
    COUNT(CASE WHEN d.approval_status = 'APPROVED' THEN 1 END) as approved_documents,
    MAX(d.uploaded_at) as last_upload_date,
    COUNT(dal.id) as total_accesses
FROM users u
LEFT JOIN event_documents d ON u.id = d.uploaded_by AND d.is_deleted = FALSE
LEFT JOIN document_access_log dal ON u.id = dal.accessed_by
GROUP BY u.id, u.first_name, u.last_name, u.email
ORDER BY documents_uploaded DESC;

-- Insert sample data for testing (optional)
-- This would be removed in production
/*
INSERT INTO event_documents (id, event_id, filename, original_name, mime_type, size, uploaded_by, category, description, tags, checksum) VALUES
(UUID(), 1, 'sample-report.pdf', 'Raport Inspecție Exemplu.pdf', 'application/pdf', 1024000, 1, 'INSPECTION_REPORT', 'Raport de inspecție pentru testare', '["test", "sample"]', 'abc123def456'),
(UUID(), 1, 'sample-photo.jpg', 'Fotografie Inspecție.jpg', 'image/jpeg', 512000, 1, 'PHOTO', 'Fotografie din inspecție', '["photo", "inspection"]', 'def456ghi789');
*/ 