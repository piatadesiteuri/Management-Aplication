-- Modul 2: Motor de fluxuri electronice (generic) - definiții, versiuni, instanțe, istoric
-- Scop: modelare declarativă (JSON), execuție + monitorizare + versionare + rollback controlat.

CREATE TABLE IF NOT EXISTS workflow_definitions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  flow_type ENUM('WORKFLOW', 'DOCUMENT', 'INFORMATION') NOT NULL,
  process_key VARCHAR(120) NULL,
  description TEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  active_version_id INT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_workflow_definitions_code (code),
  INDEX idx_workflow_definitions_type (flow_type),
  INDEX idx_workflow_definitions_active (is_active),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS workflow_definition_versions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  definition_id INT NOT NULL,
  version INT NOT NULL,
  schema_json JSON NOT NULL,
  change_note VARCHAR(500) NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_workflow_definition_versions (definition_id, version),
  INDEX idx_workflow_definition_versions_active (definition_id, is_active),
  FOREIGN KEY (definition_id) REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE workflow_definitions
  ADD CONSTRAINT fk_workflow_definitions_active_version
  FOREIGN KEY (active_version_id) REFERENCES workflow_definition_versions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS workflow_instances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  definition_id INT NOT NULL,
  version_id INT NOT NULL,
  status ENUM('ACTIVE', 'WAITING_SIGNATURE', 'COMPLETED', 'CANCELLED', 'FAILED') DEFAULT 'ACTIVE',
  current_step_key VARCHAR(120) NULL,
  context_json JSON NULL,
  started_by INT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  last_error VARCHAR(500) NULL,
  INDEX idx_workflow_instances_def (definition_id, status),
  INDEX idx_workflow_instances_started (started_at),
  FOREIGN KEY (definition_id) REFERENCES workflow_definitions(id) ON DELETE RESTRICT,
  FOREIGN KEY (version_id) REFERENCES workflow_definition_versions(id) ON DELETE RESTRICT,
  FOREIGN KEY (started_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS workflow_instance_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  instance_id INT NOT NULL,
  action ENUM('START', 'ADVANCE', 'ROLLBACK', 'CANCEL', 'COMPLETE', 'FAIL') NOT NULL,
  from_step_key VARCHAR(120) NULL,
  to_step_key VARCHAR(120) NULL,
  reason VARCHAR(500) NULL,
  comment TEXT NULL,
  performed_by INT NULL,
  performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  snapshot_json JSON NULL,
  INDEX idx_workflow_instance_history_instance (instance_id, performed_at),
  FOREIGN KEY (instance_id) REFERENCES workflow_instances(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);


