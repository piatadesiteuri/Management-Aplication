-- Migrație pentru îmbunătățiri Calendar - Asignări, Documente și Notificări
-- Creez toate tabelele necesare pentru funcționalitățile avansate ale calendarului

-- Tabel pentru asignarea utilizatorilor la evenimente
CREATE TABLE IF NOT EXISTS event_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('ORGANIZER', 'PARTICIPANT', 'OBSERVER', 'DRIVER', 'RESPONSIBLE') DEFAULT 'PARTICIPANT',
    status ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'MAYBE') DEFAULT 'PENDING',
    response_date TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_event_user (event_id, user_id),
    INDEX idx_event_assignments_event (event_id),
    INDEX idx_event_assignments_user (user_id),
    INDEX idx_event_assignments_status (status)
);

-- Tabel pentru documentele asociate cu evenimente
CREATE TABLE IF NOT EXISTS event_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    document_type ENUM('PLANNING', 'DECISION', 'REPORT', 'AUTHORIZATION', 'CHECKLIST', 'OTHER') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_event_documents_event (event_id),
    INDEX idx_event_documents_type (document_type),
    INDEX idx_event_documents_active (is_active)
);

-- Tabel pentru notificările de evenimente
CREATE TABLE IF NOT EXISTS event_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    notification_type ENUM('REMINDER', 'ASSIGNMENT', 'CHANGE', 'CANCELLATION', 'APPROVAL_REQUEST') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    send_time TIMESTAMP NOT NULL,
    sent_at TIMESTAMP NULL,
    is_read BOOLEAN DEFAULT FALSE,
    delivery_method ENUM('EMAIL', 'SYSTEM', 'BOTH') DEFAULT 'BOTH',
    status ENUM('PENDING', 'SENT', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_event_notifications_event (event_id),
    INDEX idx_event_notifications_user (user_id),
    INDEX idx_event_notifications_send_time (send_time),
    INDEX idx_event_notifications_status (status)
);

-- Tabel pentru template-uri de evenimente
CREATE TABLE IF NOT EXISTS event_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    duration_minutes INT DEFAULT 60,
    default_location VARCHAR(500),
    template_data JSON,
    department_id INT,
    created_by INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_event_templates_type (event_type),
    INDEX idx_event_templates_department (department_id),
    INDEX idx_event_templates_active (is_active)
);

-- Tabel pentru categorii și tag-uri
CREATE TABLE IF NOT EXISTS event_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3182ce',
    icon VARCHAR(50),
    department_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    INDEX idx_event_categories_department (department_id),
    INDEX idx_event_categories_active (is_active)
);

-- Tabel pentru tag-uri
CREATE TABLE IF NOT EXISTS event_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#gray',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_event_tags_name (name)
);

-- Tabel de legătură evenimente-tag-uri
CREATE TABLE IF NOT EXISTS event_tag_assignments (
    event_id INT NOT NULL,
    tag_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (event_id, tag_id),
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES event_tags(id) ON DELETE CASCADE,
    INDEX idx_event_tag_assignments_event (event_id),
    INDEX idx_event_tag_assignments_tag (tag_id)
);

-- Tabel pentru evenimente recurente
CREATE TABLE IF NOT EXISTS recurring_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_event_id INT NOT NULL,
    recurrence_pattern ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL,
    recurrence_interval INT DEFAULT 1,
    days_of_week VARCHAR(20), -- Pentru săptămânal: '1,2,3,4,5' (Luni-Vineri)
    day_of_month INT, -- Pentru lunar: ziua din lună
    month_of_year INT, -- Pentru anual: luna din an
    end_date DATE,
    max_occurrences INT,
    created_occurrences INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    INDEX idx_recurring_events_parent (parent_event_id),
    INDEX idx_recurring_events_pattern (recurrence_pattern),
    INDEX idx_recurring_events_active (is_active)
);

-- Adaug coloane noi la tabela calendar_events
ALTER TABLE calendar_events 
ADD COLUMN category_id INT NULL,
ADD COLUMN priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
ADD COLUMN approval_status ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED',
ADD COLUMN approved_by INT NULL,
ADD COLUMN approved_at TIMESTAMP NULL,
ADD COLUMN parent_event_id INT NULL,
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN metadata JSON;

-- Adaug foreign keys pentru noile coloane
ALTER TABLE calendar_events
ADD FOREIGN KEY (category_id) REFERENCES event_categories(id) ON DELETE SET NULL,
ADD FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
ADD FOREIGN KEY (parent_event_id) REFERENCES calendar_events(id) ON DELETE SET NULL;

-- Adaug indexuri pentru performanță
CREATE INDEX idx_calendar_events_category ON calendar_events(category_id);
CREATE INDEX idx_calendar_events_priority ON calendar_events(priority);
CREATE INDEX idx_calendar_events_approval_status ON calendar_events(approval_status);
CREATE INDEX idx_calendar_events_parent ON calendar_events(parent_event_id);
CREATE INDEX idx_calendar_events_recurring ON calendar_events(is_recurring);

-- Inserez categorii default
INSERT INTO event_categories (name, description, color, icon) VALUES
('Inspecții Sanitare', 'Inspecții de control sanitar', '#e53e3e', 'FiShield'),
('Deplasări Oficiale', 'Deplasări în interes de serviciu', '#3182ce', 'FiTruck'),
('Ședințe', 'Ședințe și întâlniri', '#805ad5', 'FiUsers'),
('Formare Profesională', 'Cursuri și training-uri', '#38a169', 'FiBookOpen'),
('Controale Epidemiologice', 'Controale și anchete epidemiologice', '#dd6b20', 'FiActivity'),
('Evenimente Publice', 'Evenimente și campanii publice', '#0bc5ea', 'FiMegaphone');

-- Inserez tag-uri default
INSERT INTO event_tags (name, color) VALUES
('Urgent', '#e53e3e'),
('Periodic', '#3182ce'),
('Extern', '#805ad5'),
('Intern', '#38a169'),
('Obligatoriu', '#dd6b20'),
('Opțional', '#0bc5ea'),
('Confidențial', '#718096');

-- Inserez template-uri default
INSERT INTO event_templates (name, description, event_type, duration_minutes, template_data, created_by) VALUES
('Inspecție Standard', 'Template pentru inspecții sanitare standard', 'INSPECTION', 240, '{"checklist": ["Verificare documente", "Inspecție vizuală", "Prelevare probe", "Întocmire proces-verbal"], "required_documents": ["Autorizație", "Planuri"], "equipment": ["Echipament protecție", "Instrumente măsură"]}', 1),
('Deplasare Oficială', 'Template pentru deplasări în interes de serviciu', 'TRAVEL', 480, '{"checklist": ["Aprobare deplasare", "Rezervare transport", "Cazare"], "required_documents": ["Ordin de deplasare", "Foaie de parcurs"], "budget": {"transport": 0, "cazare": 0, "diurna": 0}}', 1),
('Ședință Departament', 'Template pentru ședințe de departament', 'MEETING', 120, '{"agenda": ["Raportări", "Probleme curente", "Planificări"], "participants": [], "materials": ["Rapoarte", "Statistici"]}', 1);

-- Trigger pentru crearea automată de notificări
DELIMITER //
CREATE TRIGGER create_event_notifications
    AFTER INSERT ON calendar_events
    FOR EACH ROW
BEGIN
    -- Notificare pentru organizator
    INSERT INTO event_notifications (event_id, user_id, notification_type, title, message, send_time)
    VALUES (NEW.id, NEW.user_id, 'REMINDER', 
            CONCAT('Reminder: ', NEW.title), 
            CONCAT('Aveți programat evenimentul "', NEW.title, '" pe ', DATE_FORMAT(NEW.start_time, '%d.%m.%Y la %H:%i')),
            DATE_SUB(NEW.start_time, INTERVAL 1 HOUR));
    
    -- Notificare cu o zi înainte
    INSERT INTO event_notifications (event_id, user_id, notification_type, title, message, send_time)
    VALUES (NEW.id, NEW.user_id, 'REMINDER', 
            CONCAT('Reminder: ', NEW.title, ' (mâine)'), 
            CONCAT('Mâine aveți programat evenimentul "', NEW.title, '" la ', TIME_FORMAT(NEW.start_time, '%H:%i')),
            DATE_SUB(NEW.start_time, INTERVAL 1 DAY));
END//
DELIMITER ;

-- Trigger pentru notificări la asignări
DELIMITER //
CREATE TRIGGER notify_event_assignment
    AFTER INSERT ON event_assignments
    FOR EACH ROW
BEGIN
    DECLARE event_title VARCHAR(255);
    DECLARE event_start DATETIME;
    
    SELECT title, start_time INTO event_title, event_start
    FROM calendar_events WHERE id = NEW.event_id;
    
    INSERT INTO event_notifications (event_id, user_id, notification_type, title, message, send_time)
    VALUES (NEW.event_id, NEW.user_id, 'ASSIGNMENT', 
            CONCAT('Ați fost asignat la: ', event_title), 
            CONCAT('Ați fost asignat ca ', LOWER(NEW.role), ' la evenimentul "', event_title, '" programat pe ', DATE_FORMAT(event_start, '%d.%m.%Y la %H:%i')),
            NOW());
END//
DELIMITER ; 