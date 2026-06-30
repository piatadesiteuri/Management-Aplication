-- Migrare pentru documente evenimente
-- Adaugă tabelul pentru gestionarea documentelor evenimentelor

-- Tabel pentru documentele evenimentelor
CREATE TABLE IF NOT EXISTS event_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_event_documents_event (event_id),
    INDEX idx_event_documents_type (document_type),
    INDEX idx_event_documents_uploaded_by (uploaded_by),
    INDEX idx_event_documents_active (is_active)
);

-- Comentarii pentru documentație
ALTER TABLE event_documents COMMENT = 'Gestionează documentele atașate la evenimente';

-- Exemplu de date de test pentru documente evenimente
INSERT IGNORE INTO event_documents (
    event_id, document_type, title, description, file_name, file_path,
    file_size, mime_type, version, is_active, uploaded_by
) VALUES 
(1, 'CONTRACT', 'Contract Furnizare Test', 'Contract pentru furnizarea materialelor', 'contract_test.pdf', '/uploads/events/1/contract_test.pdf', 1024000, 'application/pdf', 1, TRUE, 1); 