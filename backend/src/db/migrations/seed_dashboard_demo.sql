-- Seed date demo pentru Dashboard
-- Populează date pentru a demonstra funcționalitatea dashboard-ului

USE spital_brasov;

-- 1. Cereri de aprobare demo (dacă nu există)
INSERT INTO approval_requests (flow_id, entity_type, entity_id, requester_id, description, status, created_at)
SELECT 
    (SELECT id FROM approval_flows ORDER BY RAND() LIMIT 1) as flow_id,
    'EVENT' as entity_type,
    ce.id as entity_id,
    u.id as requester_id,
    CONCAT('Cerere aprobare pentru eveniment: ', ce.title) as description,
    'PENDING' as status,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY) as created_at
FROM calendar_events ce
CROSS JOIN users u
WHERE ce.status IN ('PENDING', 'ACTIVE')
  AND u.is_active = 1
  AND NOT EXISTS (
      SELECT 1 FROM approval_requests ar 
      WHERE ar.entity_type = 'EVENT' 
        AND ar.entity_id = ce.id 
        AND ar.status = 'PENDING'
  )
LIMIT 5;

-- 2. Task-uri urgente demo (dacă nu există suficiente)
INSERT INTO tasks (title, description, assigned_to, assigned_by, department_id, priority, status, due_date, created_at)
SELECT 
    CONCAT('Task urgent: ', titles.title) as title,
    CONCAT('Descriere pentru ', titles.title) as description,
    u.id as assigned_to,
    COALESCE((SELECT id FROM users WHERE is_active = 1 AND id != u.id ORDER BY RAND() LIMIT 1), u.id) as assigned_by,
    COALESCE(u.department_id, (SELECT id FROM departments ORDER BY RAND() LIMIT 1)) as department_id,
    'HIGH' as priority,
    CASE (RAND() * 2)
        WHEN 0 THEN 'PENDING'
        ELSE 'IN_PROGRESS'
    END as status,
    DATE_ADD(CURDATE(), INTERVAL FLOOR(RAND() * 3) DAY) as due_date,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 5) DAY) as created_at
FROM (
    SELECT 'Verificare echipamente medicale' as title UNION ALL
    SELECT 'Raportare consumuri luna curentă' UNION ALL
    SELECT 'Actualizare protocoluri de siguranță' UNION ALL
    SELECT 'Revizie contracte furnizori' UNION ALL
    SELECT 'Pregătire audit intern'
) as titles
CROSS JOIN users u
WHERE u.is_active = 1
  AND NOT EXISTS (
      SELECT 1 FROM tasks t 
      WHERE t.title LIKE CONCAT('%', titles.title, '%') 
        AND t.status IN ('PENDING', 'IN_PROGRESS')
  )
LIMIT 5;

-- 3. Utilizatori noi demo (ultimele 7 zile)
INSERT INTO users (username, email, password, first_name, last_name, role, department_id, is_active, is_email_verified, created_at)
SELECT 
    CONCAT('user', FLOOR(RAND() * 10000)) as username,
    CONCAT('user', FLOOR(RAND() * 10000), '@spitalbrasov.ro') as email,
    '$2b$10$dummy.hash.for.demo.purposes.only' as password,
    first_names.first_name,
    last_names.last_name,
    roles.role,
    (SELECT id FROM departments ORDER BY RAND() LIMIT 1) as department_id,
    1 as is_active,
    1 as is_email_verified,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY) as created_at
FROM (
    SELECT 'Ion' as first_name UNION ALL SELECT 'Maria' UNION ALL SELECT 'Gheorghe' UNION ALL SELECT 'Elena' UNION ALL SELECT 'Alexandru'
) as first_names
CROSS JOIN (
    SELECT 'Popescu' as last_name UNION ALL SELECT 'Ionescu' UNION ALL SELECT 'Georgescu' UNION ALL SELECT 'Radu' UNION ALL SELECT 'Stoica'
) as last_names
CROSS JOIN (
    SELECT 'ADMIN' as role UNION ALL SELECT 'MANAGER' UNION ALL SELECT 'INSPECTOR' UNION ALL SELECT 'WAREHOUSE_KEEPER'
) as roles
WHERE NOT EXISTS (
    SELECT 1 FROM users u 
    WHERE u.email = CONCAT('user', FLOOR(RAND() * 10000), '@spitalbrasov.ro')
)
LIMIT 5;

-- 4. Documente recente demo (dacă nu există suficiente)
INSERT INTO event_documents (event_id, document_type, title, description, file_name, file_path, file_size, mime_type, is_active, uploaded_by, created_at)
SELECT 
    ce.id as event_id,
    'REPORT' as document_type,
    CONCAT('Raport ', doc_types.doc_type) as title,
    CONCAT('Document pentru eveniment: ', ce.title) as description,
    CONCAT('raport_', ce.id, '_', doc_types.doc_type, '.pdf') as file_name,
    CONCAT('/uploads/documents/raport_', ce.id, '.pdf') as file_path,
    FLOOR(50000 + RAND() * 200000) as file_size,
    'application/pdf' as mime_type,
    1 as is_active,
    (SELECT id FROM users WHERE is_active = 1 ORDER BY RAND() LIMIT 1) as uploaded_by,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY) as created_at
FROM calendar_events ce
CROSS JOIN (
    SELECT 'Medical' as doc_type UNION ALL
    SELECT 'Administrativ' UNION ALL
    SELECT 'Financiar' UNION ALL
    SELECT 'Operațional'
) as doc_types
WHERE ce.status IN ('ACTIVE', 'COMPLETED')
  AND NOT EXISTS (
      SELECT 1 FROM event_documents ed 
      WHERE ed.event_id = ce.id 
        AND ed.title LIKE CONCAT('%', doc_types.doc_type, '%')
  )
LIMIT 5;

-- 5. Activitate recentă demo (dacă nu există suficiente)
INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, description, details, ip_address, created_at)
SELECT 
    u.id as user_id,
    actions.action_type,
    actions.entity_type,
    CASE actions.entity_type
        WHEN 'EVENT' THEN (SELECT id FROM calendar_events ORDER BY RAND() LIMIT 1)
        WHEN 'DOCUMENT' THEN (SELECT id FROM event_documents ORDER BY RAND() LIMIT 1)
        WHEN 'USER' THEN (SELECT id FROM users WHERE id != u.id ORDER BY RAND() LIMIT 1)
        ELSE NULL
    END as entity_id,
    actions.description,
    JSON_OBJECT('demo', true, 'source', 'seed_dashboard') as details,
    CONCAT('192.168.1.', FLOOR(10 + RAND() * 245)) as ip_address,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 24) HOUR) as created_at
FROM users u
CROSS JOIN (
    SELECT 'EVENT_CREATED' as action_type, 'EVENT' as entity_type, 'Eveniment nou creat' as description UNION ALL
    SELECT 'DOCUMENT_UPLOADED', 'DOCUMENT', 'Document încărcat' UNION ALL
    SELECT 'USER_UPDATED', 'USER', 'Utilizator actualizat' UNION ALL
    SELECT 'TASK_ASSIGNED', 'TASK', 'Task asignat' UNION ALL
    SELECT 'APPROVAL_REQUESTED', 'APPROVAL', 'Cerere aprobare creată'
) as actions
WHERE u.is_active = 1
  AND NOT EXISTS (
      SELECT 1 FROM activity_logs al 
      WHERE al.user_id = u.id 
        AND al.action_type = actions.action_type
        AND DATE(al.created_at) = CURDATE()
  )
LIMIT 10;

-- 6. Alerte demo (dacă nu există suficiente HIGH/CRITICAL)
INSERT INTO alerts (rule_id, title, message, severity, status, entity_type, entity_id, created_at)
SELECT 
    (SELECT id FROM alert_rules ORDER BY RAND() LIMIT 1) as rule_id,
    CONCAT('Alertă ', severities.severity, ': ', alert_types.alert_type) as title,
    CONCAT('Mesaj de alertă pentru ', alert_types.alert_type, '. Acesta este un mesaj demo.') as message,
    severities.severity,
    'ACTIVE' as status,
    'EVENT' as entity_type,
    (SELECT id FROM calendar_events ORDER BY RAND() LIMIT 1) as entity_id,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 24) HOUR) as created_at
FROM (
    SELECT 'HIGH' as severity UNION ALL SELECT 'CRITICAL'
) as severities
CROSS JOIN (
    SELECT 'Echipament medical' as alert_type UNION ALL
    SELECT 'Stoc minim' UNION ALL
    SELECT 'Cerere aprobare urgentă' UNION ALL
    SELECT 'Task depășit termenul'
) as alert_types
WHERE NOT EXISTS (
    SELECT 1 FROM alerts a 
    WHERE a.severity = severities.severity 
      AND a.status = 'ACTIVE'
      AND a.title LIKE CONCAT('%', alert_types.alert_type, '%')
)
LIMIT 5;

-- Verificare date create
SELECT '=== DATE DEMO CREATE PENTRU DASHBOARD ===' as info;

SELECT 'Cereri aprobare:' as info;
SELECT COUNT(*) as total FROM approval_requests WHERE status = 'PENDING';

SELECT 'Task-uri urgente:' as info;
SELECT COUNT(*) as total FROM tasks WHERE status IN ('PENDING', 'IN_PROGRESS') AND (priority = 'HIGH' OR due_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY));

SELECT 'Utilizatori noi (ultimele 7 zile):' as info;
SELECT COUNT(*) as total FROM users WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);

SELECT 'Documente recente:' as info;
SELECT COUNT(*) as total FROM event_documents WHERE is_active = 1 AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY);

SELECT 'Activitate recentă (ultimele 24h):' as info;
SELECT COUNT(*) as total FROM activity_logs WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY);

SELECT 'Alerte active HIGH/CRITICAL:' as info;
SELECT COUNT(*) as total FROM alerts WHERE status = 'ACTIVE' AND severity IN ('HIGH', 'CRITICAL');

