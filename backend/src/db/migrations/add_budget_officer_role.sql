INSERT INTO roles (name, description)
VALUES ('BUDGET_OFFICER', 'Responsabil buget si finante')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code IN (
    'dashboard.view',
    'calendar.view',
    'tasks.view',
    'documents.view',
    'reports.view',
    'budget.view',
    'notifications.view',
    'profile.view'
)
WHERE r.name = 'BUDGET_OFFICER';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code = 'tasks.view'
WHERE r.name = 'WAREHOUSE_KEEPER';
