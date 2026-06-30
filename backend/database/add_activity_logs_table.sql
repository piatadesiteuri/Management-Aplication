-- Tabela pentru logurile de activitate
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action_type ENUM(
    'EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_DELETED', 'EVENT_ASSIGNED', 'EVENT_UNASSIGNED',
    'VEHICLE_CREATED', 'VEHICLE_UPDATED', 'VEHICLE_DELETED', 'VEHICLE_DOCUMENT_ADDED',
    'SUPPLIER_CREATED', 'SUPPLIER_UPDATED', 'SUPPLIER_DELETED',
    'USER_CREATED', 'USER_UPDATED', 'USER_DELETED',
    'ALERT_CREATED', 'ALERT_RESOLVED',
    'LOGIN', 'LOGOUT', 'PASSWORD_CHANGED',
    'REPORT_GENERATED', 'SETTINGS_CHANGED'
  ) NOT NULL,
  entity_type ENUM('EVENT', 'VEHICLE', 'SUPPLIER', 'USER', 'ALERT', 'SYSTEM') NOT NULL,
  entity_id INT,
  description TEXT NOT NULL,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_action_type (action_type),
  INDEX idx_entity_type (entity_type),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Inserare date de test pentru loguri
INSERT INTO activity_logs (user_id, action_type, entity_type, entity_id, description, details, ip_address) VALUES
(1, 'EVENT_CREATED', 'EVENT', 1, 'A creat evenimentul "Inspecție Spital Județean"', '{"event_title": "Inspecție Spital Județean", "start_time": "2025-07-10 00:00:00"}', '192.168.1.100'),
(1, 'EVENT_ASSIGNED', 'EVENT', 1, 'A asignat utilizatorul "Ion Popescu" la evenimentul "Inspecție Spital Județean"', '{"assigned_user": "Ion Popescu", "role": "PARTICIPANT"}', '192.168.1.100'),
(1, 'VEHICLE_CREATED', 'VEHICLE', 1, 'A adăugat vehiculul "Dacia Logan DJ-01-DSP"', '{"vehicle_brand": "Dacia", "vehicle_model": "Logan", "plate": "DJ-01-DSP"}', '192.168.1.100'),
(1, 'VEHICLE_DOCUMENT_ADDED', 'VEHICLE', 1, 'A încărcat documentul "RCA" pentru vehiculul "Dacia Logan"', '{"document_type": "RCA", "expiry_date": "2025-08-03"}', '192.168.1.100'),
(1, 'ALERT_CREATED', 'ALERT', 1, 'S-a generat alertă pentru vehiculul "Dacia Logan" - RCA expiră în 30 zile', '{"alert_severity": "HIGH", "alert_type": "VEHICLE"}', '192.168.1.100'),
(1, 'ALERT_RESOLVED', 'ALERT', 1, 'A rezolvat alerta pentru vehiculul "Dacia Logan"', '{"alert_severity": "HIGH", "alert_type": "VEHICLE"}', '192.168.1.100'),
(1, 'EVENT_UPDATED', 'EVENT', 3, 'A actualizat evenimentul "Ședință Departament"', '{"changes": ["status", "description"]}', '192.168.1.100'),
(1, 'REPORT_GENERATED', 'SYSTEM', NULL, 'A generat raportul "Alerte Active"', '{"report_type": "ALERTS", "date_range": "2025-07-01 to 2025-07-23"}', '192.168.1.100'),
(1, 'LOGIN', 'SYSTEM', NULL, 'S-a conectat la sistem', '{"login_method": "email", "success": true}', '192.168.1.100'),
(1, 'SETTINGS_CHANGED', 'SYSTEM', NULL, 'A modificat setările de notificări', '{"notification_email": true, "notification_sms": false}', '192.168.1.100'),
(1, 'SUPPLIER_CREATED', 'SUPPLIER', 1, 'A adăugat furnizorul "MedSupply SRL"', '{"supplier_name": "MedSupply SRL", "contact_email": "ana.popescu@medsupply.ro"}', '192.168.1.100'),
(1, 'EVENT_CREATED', 'EVENT', 48, 'A creat comanda "MedSupply SRL - Comandă #1753257675779"', '{"order_id": "1753257675779", "supplier": "MedSupply SRL"}', '192.168.1.100'),
(1, 'ALERT_CREATED', 'ALERT', 18, 'S-a generat alertă pentru evenimentul "Inspecție Spital Județean" - status nefinalizat', '{"alert_severity": "MEDIUM", "alert_type": "EVENT"}', '192.168.1.100'),
(1, 'ALERT_CREATED', 'ALERT', 19, 'S-a generat alertă pentru comanda "MedSupply SRL" - status nefinalizat', '{"alert_severity": "MEDIUM", "alert_type": "EVENT"}', '192.168.1.100'); 