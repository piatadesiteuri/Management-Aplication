-- Script pentru redenumirea tabelelor de interoperabilitate
-- Conform convenției: prefixul trebuie să fie "interoperability_"

USE spital_brasov;

-- Verifică dacă tabelele vechi există și le redenumește
-- Dacă tabelele noi există deja, nu face nimic

-- 1. Redenumește external_integrations -> interoperability_integrations
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'spital_brasov' AND table_name = 'external_integrations');
SET @new_table_exists = (SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'spital_brasov' AND table_name = 'interoperability_integrations');

SET @sql = IF(@table_exists > 0 AND @new_table_exists = 0,
  'RENAME TABLE external_integrations TO interoperability_integrations;',
  'SELECT "Tabelul external_integrations nu există sau interoperability_integrations există deja" AS message;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Redenumește external_reports -> interoperability_reports
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'spital_brasov' AND table_name = 'external_reports');
SET @new_table_exists = (SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'spital_brasov' AND table_name = 'interoperability_reports');

SET @sql = IF(@table_exists > 0 AND @new_table_exists = 0,
  'RENAME TABLE external_reports TO interoperability_reports;',
  'SELECT "Tabelul external_reports nu există sau interoperability_reports există deja" AS message;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Redenumește integration_logs -> interoperability_logs
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'spital_brasov' AND table_name = 'integration_logs');
SET @new_table_exists = (SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'spital_brasov' AND table_name = 'interoperability_logs');

SET @sql = IF(@table_exists > 0 AND @new_table_exists = 0,
  'RENAME TABLE integration_logs TO interoperability_logs;',
  'SELECT "Tabelul integration_logs nu există sau interoperability_logs există deja" AS message;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Redenumește auto_report_configs -> interoperability_auto_report_configs
SET @table_exists = (SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'spital_brasov' AND table_name = 'auto_report_configs');
SET @new_table_exists = (SELECT COUNT(*) FROM information_schema.tables 
  WHERE table_schema = 'spital_brasov' AND table_name = 'interoperability_auto_report_configs');

SET @sql = IF(@table_exists > 0 AND @new_table_exists = 0,
  'RENAME TABLE auto_report_configs TO interoperability_auto_report_configs;',
  'SELECT "Tabelul auto_report_configs nu există sau interoperability_auto_report_configs există deja" AS message;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizează foreign keys pentru interoperability_reports
ALTER TABLE interoperability_reports 
  DROP FOREIGN KEY IF EXISTS external_reports_ibfk_1,
  ADD CONSTRAINT interoperability_reports_ibfk_1 
    FOREIGN KEY (integration_id) REFERENCES interoperability_integrations(id) ON DELETE RESTRICT;

-- Actualizează foreign keys pentru interoperability_logs
ALTER TABLE interoperability_logs 
  DROP FOREIGN KEY IF EXISTS integration_logs_ibfk_1,
  ADD CONSTRAINT interoperability_logs_ibfk_1 
    FOREIGN KEY (integration_id) REFERENCES interoperability_integrations(id) ON DELETE CASCADE;

-- Actualizează foreign keys pentru interoperability_auto_report_configs
ALTER TABLE interoperability_auto_report_configs 
  DROP FOREIGN KEY IF EXISTS auto_report_configs_ibfk_1,
  ADD CONSTRAINT interoperability_auto_report_configs_ibfk_1 
    FOREIGN KEY (integration_id) REFERENCES interoperability_integrations(id) ON DELETE CASCADE;

SELECT 'Migrarea tabelelor a fost finalizată!' AS message;

