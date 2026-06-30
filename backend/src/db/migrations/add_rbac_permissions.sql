CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(100) NOT NULL UNIQUE,
    module_key VARCHAR(100) NOT NULL,
    label VARCHAR(150) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

INSERT INTO permissions (code, module_key, label, description) VALUES
('dashboard.view', 'dashboard', 'Dashboard', 'Poate accesa dashboard-urile aplicației'),
('calendar.view', 'calendar', 'Calendar', 'Poate accesa calendarul și evenimentele'),
('tasks.view', 'tasks', 'Task Management', 'Poate accesa taskurile și fluxurile de lucru'),
('documents.view', 'documents', 'Documente', 'Poate accesa documentele din sistem'),
('vehicles.view', 'vehicles', 'Parc Auto', 'Poate accesa modulul Parc Auto'),
('supply.view', 'supply', 'Gestiune Stocuri', 'Poate accesa furnizori, produse și stoc'),
('stock_audit.view', 'stock_audit', 'Audit Stoc', 'Poate accesa istoricul modificărilor de stoc'),
('material_requests.view', 'material_requests', 'Cereri materiale', 'Poate accesa cererile de materiale'),
('traceability.view', 'traceability', 'Trasabilitate', 'Poate accesa trasabilitatea operațiunilor'),
('reports.view', 'reports', 'Rapoarte', 'Poate accesa rapoartele manuale și de utilizator'),
('bi.view', 'business_intelligence', 'Business Intelligence', 'Poate accesa dashboard-urile executive'),
('automated_reports.view', 'automated_reports', 'Rapoarte automate', 'Poate accesa și genera rapoarte automate'),
('alerts.view', 'alerts', 'Alerte', 'Poate accesa centrul de alerte'),
('activity_logs.view', 'activity_logs', 'Loguri activitate', 'Poate accesa logurile de activitate'),
('personal_data_access.view', 'personal_data_access', 'Raport acces date personale', 'Poate accesa raportul GDPR de acces la date personale'),
('patients.view', 'patients', 'Pacienți', 'Poate accesa modulul pacienți'),
('patient_portal.view', 'patient_portal', 'Portal pacienți', 'Poate accesa portalul pacienților'),
('lims.view', 'lims', 'Laborator', 'Poate accesa modulul LIMS'),
('pharmacy.view', 'pharmacy', 'Farmacie', 'Poate accesa modulul de farmacie'),
('budget.view', 'budget', 'Buget', 'Poate accesa modulul buget și execuție'),
('interoperability.view', 'interoperability', 'Interoperabilitate', 'Poate accesa integrările externe'),
('workflows.view', 'workflows', 'Motor fluxuri', 'Poate accesa motorul de workflow'),
('users.manage', 'users', 'Administrare utilizatori', 'Poate crea, modifica și șterge utilizatori'),
('roles.manage', 'roles', 'Administrare roluri', 'Poate administra roluri și permisiuni'),
('system_settings.manage', 'system_settings', 'Setări sistem', 'Poate modifica setările aplicației'),
('notifications.view', 'notifications', 'Notificări', 'Poate accesa centrul de notificări'),
('profile.view', 'profile', 'Profil', 'Poate accesa și actualiza propriul profil')
ON DUPLICATE KEY UPDATE
    module_key = VALUES(module_key),
    label = VALUES(label),
    description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p
WHERE r.name IN ('SUPER_ADMIN', 'ADMIN');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'dashboard.view',
    'calendar.view',
    'tasks.view',
    'documents.view',
    'vehicles.view',
    'supply.view',
    'stock_audit.view',
    'material_requests.view',
    'traceability.view',
    'reports.view',
    'bi.view',
    'automated_reports.view',
    'alerts.view',
    'activity_logs.view',
    'personal_data_access.view',
    'patients.view',
    'patient_portal.view',
    'lims.view',
    'pharmacy.view',
    'interoperability.view',
    'workflows.view',
    'notifications.view',
    'profile.view',
    'users.manage',
    'system_settings.manage'
)
WHERE r.name = 'DEPARTMENT_ADMIN';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'dashboard.view',
    'calendar.view',
    'tasks.view',
    'documents.view',
    'vehicles.view',
    'material_requests.view',
    'traceability.view',
    'reports.view',
    'alerts.view',
    'activity_logs.view',
    'patients.view',
    'patient_portal.view',
    'notifications.view',
    'profile.view'
)
WHERE r.name = 'MANAGER';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'dashboard.view',
    'calendar.view',
    'tasks.view',
    'documents.view',
    'reports.view',
    'traceability.view',
    'patient_portal.view',
    'notifications.view',
    'profile.view'
)
WHERE r.name = 'INSPECTOR';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'dashboard.view',
    'calendar.view',
    'tasks.view',
    'documents.view',
    'notifications.view',
    'profile.view'
)
WHERE r.name = 'OPERATOR';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'dashboard.view',
    'calendar.view',
    'notifications.view',
    'profile.view'
)
WHERE r.name = 'VIEWER';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'dashboard.view',
    'calendar.view',
    'documents.view',
    'reports.view',
    'supply.view',
    'stock_audit.view',
    'material_requests.view',
    'lims.view',
    'notifications.view',
    'profile.view'
)
WHERE r.name = 'WAREHOUSE_KEEPER';
