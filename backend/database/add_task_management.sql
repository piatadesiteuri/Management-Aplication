-- Task Management System
-- Tabele pentru gestionarea sarcinilor, workflow-urilor și aprobărilor

-- Tabela pentru task-uri
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INT NOT NULL,
  assigned_by INT NOT NULL,
  department_id INT,
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
  status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  due_date DATETIME,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2) DEFAULT 0,
  dependencies JSON, -- task-uri dependente
  attachments JSON, -- fișiere atașate
  tags JSON, -- tag-uri pentru categorizare
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Tabela pentru comentarii la task-uri
CREATE TABLE IF NOT EXISTS task_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela pentru istoricul task-urilor
CREATE TABLE IF NOT EXISTS task_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'CREATED', 'ASSIGNED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'COMMENTED'
  old_value TEXT,
  new_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela pentru workflow-uri
CREATE TABLE IF NOT EXISTS workflows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  department_id INT,
  entity_type VARCHAR(50) NOT NULL, -- 'TASK', 'PURCHASE', 'DOCUMENT', 'EVENT'
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Tabela pentru pașii workflow-ului
CREATE TABLE IF NOT EXISTS workflow_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflow_id INT NOT NULL,
  step_order INT NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  step_type ENUM('APPROVAL', 'NOTIFICATION', 'TASK', 'DECISION') NOT NULL,
  assigned_role VARCHAR(100),
  required_approval BOOLEAN DEFAULT FALSE,
  estimated_duration_hours INT,
  conditions JSON, -- condiții pentru trecerea la următorul pas
  actions JSON, -- acțiuni automate
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- Tabela pentru instanțele de workflow
CREATE TABLE IF NOT EXISTS workflow_instances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflow_id INT NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  current_step INT NOT NULL,
  status ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'ACTIVE',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  created_by INT NOT NULL,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela pentru fluxuri de aprobare
CREATE TABLE IF NOT EXISTS approval_flows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50) NOT NULL, -- 'TASK', 'PURCHASE', 'DOCUMENT', 'BUDGET'
  department_id INT,
  min_amount DECIMAL(15,2) DEFAULT 0,
  max_amount DECIMAL(15,2),
  required_approvers JSON NOT NULL, -- [{"role": "DIRECTOR", "order": 1}, {"role": "ADMIN", "order": 2}]
  auto_approve_under DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Tabela pentru cererile de aprobare
CREATE TABLE IF NOT EXISTS approval_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flow_id INT NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  requester_id INT NOT NULL,
  amount DECIMAL(15,2) DEFAULT 0,
  description TEXT,
  status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
  current_approver_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (flow_id) REFERENCES approval_flows(id) ON DELETE CASCADE,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (current_approver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabela pentru deciziile de aprobare
CREATE TABLE IF NOT EXISTS approval_decisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  approver_id INT NOT NULL,
  decision ENUM('APPROVE', 'REJECT', 'DELEGATE') NOT NULL,
  comments TEXT,
  delegated_to_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES approval_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (delegated_to_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexuri pentru performanță
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_department ON tasks(department_id);
CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_workflow_instances_entity ON workflow_instances(entity_type, entity_id);
CREATE INDEX idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);

-- Inserare date de test pentru workflow-uri
INSERT INTO workflows (name, description, entity_type, is_active) VALUES
('Aprobare Task Critic', 'Workflow pentru aprobarea task-urilor critice', 'TASK', TRUE),
('Aprobare Achiziție', 'Workflow pentru aprobarea achizițiilor', 'PURCHASE', TRUE),
('Aprobare Document', 'Workflow pentru aprobarea documentelor importante', 'DOCUMENT', TRUE);

-- Inserare pași pentru workflow-ul de aprobare task-uri
INSERT INTO workflow_steps (workflow_id, step_order, step_name, step_type, assigned_role, required_approval, estimated_duration_hours) VALUES
(1, 1, 'Verificare Inițială', 'TASK', 'SUPERVISOR', FALSE, 2),
(1, 2, 'Aprobare Manager', 'APPROVAL', 'MANAGER', TRUE, 4),
(1, 3, 'Aprobare Director', 'APPROVAL', 'DIRECTOR', TRUE, 8),
(1, 4, 'Notificare Echipă', 'NOTIFICATION', 'TEAM_LEAD', FALSE, 1);

-- Inserare fluxuri de aprobare
INSERT INTO approval_flows (name, description, entity_type, min_amount, max_amount, required_approvers, auto_approve_under) VALUES
('Aprobare Task Simplu', 'Aprobare pentru task-uri simple', 'TASK', 0, 1000, '[{"role": "SUPERVISOR", "order": 1}]', 100),
('Aprobare Task Complex', 'Aprobare pentru task-uri complexe', 'TASK', 1000, 10000, '[{"role": "MANAGER", "order": 1}, {"role": "DIRECTOR", "order": 2}]', 0),
('Aprobare Achiziție Mică', 'Aprobare pentru achiziții mici', 'PURCHASE', 0, 5000, '[{"role": "MANAGER", "order": 1}]', 500),
('Aprobare Achiziție Mare', 'Aprobare pentru achiziții mari', 'PURCHASE', 5000, 999999, '[{"role": "MANAGER", "order": 1}, {"role": "DIRECTOR", "order": 2}, {"role": "ADMIN", "order": 3}]', 0); 