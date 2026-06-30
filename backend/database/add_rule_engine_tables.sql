-- Tabela pentru regulile de alerte
CREATE TABLE IF NOT EXISTS alert_rules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type ENUM('EVENT', 'VEHICLE', 'SUPPLIER', 'USER') NOT NULL,
  condition_sql TEXT NOT NULL COMMENT 'SQL condition pentru evaluarea regulii',
  severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notification_channels JSON NOT NULL COMMENT '["email", "in_app", "sms"]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela pentru alertele generate
CREATE TABLE IF NOT EXISTS alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rule_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
  status ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED') NOT NULL DEFAULT 'ACTIVE',
  entity_type ENUM('EVENT', 'VEHICLE', 'SUPPLIER', 'USER') NOT NULL,
  entity_id INT NOT NULL,
  user_id INT NULL,
  department_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP NULL,
  resolved_at TIMESTAMP NULL,
  acknowledged_by INT NULL,
  resolved_by INT NULL,
  FOREIGN KEY (rule_id) REFERENCES alert_rules(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_alerts_status (status),
  INDEX idx_alerts_severity (severity),
  INDEX idx_alerts_entity (entity_type, entity_id),
  INDEX idx_alerts_user (user_id),
  INDEX idx_alerts_created (created_at)
);

-- Inserare reguli predefinite pentru evenimente
INSERT INTO alert_rules (name, description, type, condition_sql, severity, notification_channels) VALUES
(
  'Eveniment fără asignări în 24h',
  'Evenimentul va începe în 24 de ore dar nu are participanți asignati',
  'EVENT',
  'SELECT ce.* FROM calendar_events ce 
   LEFT JOIN event_assignments ea ON ce.id = ea.event_id 
   WHERE ce.start_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)
   AND ce.status = "PENDING"
   AND ea.id IS NULL',
  'HIGH',
  '["email", "in_app"]'
),
(
  'Eveniment în trecut fără status finalizat',
  'Evenimentul a început dar nu are status finalizat',
  'EVENT',
  'SELECT ce.* FROM calendar_events ce 
   WHERE ce.start_time < NOW() 
   AND ce.status NOT IN ("COMPLETED", "CANCELLED")',
  'MEDIUM',
  '["email", "in_app"]'
),
(
  'Evenimente multiple în aceeași zi',
  'Utilizatorul are mai mult de 5 evenimente în aceeași zi',
  'USER',
  'SELECT u.*, COUNT(ea.event_id) as event_count 
   FROM users u 
   JOIN event_assignments ea ON u.id = ea.user_id 
   JOIN calendar_events ce ON ea.event_id = ce.id 
   WHERE DATE(ce.start_time) = CURDATE() 
   GROUP BY u.id 
   HAVING event_count > 5',
  'LOW',
  '["in_app"]'
);

-- Inserare reguli predefinite pentru vehicule
INSERT INTO alert_rules (name, description, type, condition_sql, severity, notification_channels) VALUES
(
  'ITP expiră în 30 zile',
  'ITP-ul vehiculului va expira în 30 de zile',
  'VEHICLE',
  'SELECT v.* FROM vehicles v 
   JOIN vehicle_documents vd ON v.id = vd.vehicle_id 
   WHERE vd.type = "ITP" 
   AND vd.expiry_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)',
  'MEDIUM',
  '["email", "in_app"]'
),
(
  'RCA expiră în 30 zile',
  'Asigurarea RCA a vehiculului va expira în 30 de zile',
  'VEHICLE',
  'SELECT v.* FROM vehicles v 
   JOIN vehicle_documents vd ON v.id = vd.vehicle_id 
   WHERE vd.type = "RCA" 
   AND vd.expiry_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)',
  'HIGH',
  '["email", "in_app"]'
);

-- Inserare reguli predefinite pentru furnizori
INSERT INTO alert_rules (name, description, type, condition_sql, severity, notification_channels) VALUES
(
  'Comandă întârziată',
  'Comanda la furnizor este în așteptare de mai mult de 7 zile',
  'SUPPLIER',
  'SELECT s.* FROM suppliers s 
   JOIN calendar_events ce ON ce.metadata LIKE CONCAT("%supplierId%:", s.id, "%") 
   WHERE ce.type = "SUPPLY_ORDER" 
   AND ce.status = "PENDING" 
   AND ce.start_time < DATE_SUB(NOW(), INTERVAL 7 DAY)',
  'MEDIUM',
  '["email", "in_app"]'
);

-- Indexuri pentru performanță
CREATE INDEX idx_alert_rules_active ON alert_rules(is_active);
CREATE INDEX idx_alert_rules_type ON alert_rules(type);
CREATE INDEX idx_alerts_rule_entity ON alerts(rule_id, entity_type, entity_id); 