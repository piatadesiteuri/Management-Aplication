-- Creează tabela pentru template-uri de task-uri
CREATE TABLE task_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100) NOT NULL,
    task_steps JSON NOT NULL, -- Array de pași pentru workflow
    estimated_duration_hours DECIMAL(5,2) DEFAULT 1.0,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserează template-uri pentru DSPD
INSERT INTO task_templates (name, description, event_type, task_steps, estimated_duration_hours, priority) VALUES
(
    'Inspecție Sanitară Completă',
    'Workflow complet pentru inspecții sanitare',
    'INSPECTION',
    JSON_ARRAY(
        JSON_OBJECT('step', 'PREPARATION', 'name', 'Pregătire Documente', 'description', 'Pregătirea documentelor necesare pentru inspecție', 'estimated_hours', 2),
        JSON_OBJECT('step', 'EXECUTION', 'name', 'Efectuare Inspecție', 'description', 'Efectuarea inspecției propriu-zise', 'estimated_hours', 4),
        JSON_OBJECT('step', 'REPORTING', 'name', 'Completare Raport', 'description', 'Completarea raportului de inspecție', 'estimated_hours', 3),
        JSON_OBJECT('step', 'APPROVAL', 'name', 'Aprobare Raport', 'description', 'Aprobarea raportului de către supervizor', 'estimated_hours', 1)
    ),
    10.0,
    'HIGH'
),
(
    'Monitorizare Boli Infecțioase',
    'Workflow pentru monitorizarea bolilor infecțioase',
    'MONITORING',
    JSON_ARRAY(
        JSON_OBJECT('step', 'DATA_COLLECTION', 'name', 'Colectare Date', 'description', 'Colectarea datelor despre cazuri', 'estimated_hours', 3),
        JSON_OBJECT('step', 'ANALYSIS', 'name', 'Analiză Date', 'description', 'Analiza datelor colectate', 'estimated_hours', 4),
        JSON_OBJECT('step', 'REPORTING', 'name', 'Raportare Autorități', 'description', 'Raportarea către autoritățile competente', 'estimated_hours', 2)
    ),
    9.0,
    'CRITICAL'
),
(
    'Control Calitate Apă',
    'Workflow pentru controlul calității apei',
    'WATER_QUALITY',
    JSON_ARRAY(
        JSON_OBJECT('step', 'SAMPLING', 'name', 'Colectare Probe', 'description', 'Colectarea probelor de apă', 'estimated_hours', 2),
        JSON_OBJECT('step', 'TESTING', 'name', 'Testare Laborator', 'description', 'Testarea probelor în laborator', 'estimated_hours', 6),
        JSON_OBJECT('step', 'ANALYSIS', 'name', 'Analiză Rezultate', 'description', 'Analiza rezultatelor testelor', 'estimated_hours', 3),
        JSON_OBJECT('step', 'REPORTING', 'name', 'Raport Final', 'description', 'Elaborarea raportului final', 'estimated_hours', 2)
    ),
    13.0,
    'HIGH'
),
(
    'Audit Siguranță Medicală',
    'Workflow pentru audituri de siguranță la facilități medicale',
    'AUDIT',
    JSON_ARRAY(
        JSON_OBJECT('step', 'PLANNING', 'name', 'Planificare Audit', 'description', 'Planificarea auditului', 'estimated_hours', 4),
        JSON_OBJECT('step', 'EXECUTION', 'name', 'Efectuare Audit', 'description', 'Efectuarea auditului', 'estimated_hours', 8),
        JSON_OBJECT('step', 'DOCUMENTATION', 'name', 'Documentare', 'description', 'Documentarea constatărilor', 'estimated_hours', 4),
        JSON_OBJECT('step', 'RECOMMENDATIONS', 'name', 'Elaborare Recomandări', 'description', 'Elaborarea recomandărilor', 'estimated_hours', 3),
        JSON_OBJECT('step', 'FOLLOW_UP', 'name', 'Urmărire Implementare', 'description', 'Urmărirea implementării recomandărilor', 'estimated_hours', 2)
    ),
    21.0,
    'CRITICAL'
);

-- Creează tabela pentru workflow-uri active
CREATE TABLE task_workflows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    template_id INT NOT NULL,
    status ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'ACTIVE',
    current_step VARCHAR(50) NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    created_by INT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES task_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Adaugă indexuri pentru workflow-uri
CREATE INDEX idx_task_workflows_event_id ON task_workflows(event_id);
CREATE INDEX idx_task_workflows_status ON task_workflows(status);
CREATE INDEX idx_task_workflows_current_step ON task_workflows(current_step); 