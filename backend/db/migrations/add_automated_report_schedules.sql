-- Tabela pentru programările rapoartelor automate
CREATE TABLE IF NOT EXISTS automated_report_schedules (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  user_id INT NOT NULL,
  frequency ENUM('DAILY', 'WEEKLY', 'MONTHLY') NOT NULL,
  time TIME NOT NULL,
  day_of_week TINYINT NULL, -- 0-6 (Duminică = 0)
  day_of_month TINYINT NULL, -- 1-31
  is_active BOOLEAN DEFAULT TRUE,
  parameters JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, is_active),
  INDEX idx_frequency_time (frequency, time)
);

-- Adaug coloane pentru notificări
ALTER TABLE notifications 
ADD COLUMN title VARCHAR(255) NULL AFTER user_id,
ADD COLUMN data JSON NULL AFTER message,
ADD COLUMN is_read BOOLEAN DEFAULT FALSE AFTER data;

-- Inserare date de test pentru programări automate
INSERT INTO automated_report_schedules (id, type, user_id, frequency, time, day_of_week, day_of_month, is_active, parameters) VALUES
('schedule_daily_events_1', 'DAILY_EVENTS_SUMMARY', 1, 'DAILY', '08:00:00', NULL, NULL, TRUE, '{}'),
('schedule_weekly_activity_1', 'WEEKLY_DEPARTMENT_ACTIVITY', 1, 'WEEKLY', '09:00:00', 1, NULL, TRUE, '{}'),
('schedule_monthly_performance_1', 'MONTHLY_DSPD_PERFORMANCE', 1, 'MONTHLY', '10:00:00', NULL, 1, TRUE, '{}'),
('schedule_vehicle_alerts_1', 'VEHICLE_MAINTENANCE_ALERT', 1, 'DAILY', '07:00:00', NULL, NULL, TRUE, '{}'),
('schedule_stock_alerts_1', 'LOW_STOCK_ALERT', 1, 'WEEKLY', '08:30:00', 2, NULL, TRUE, '{}'); 