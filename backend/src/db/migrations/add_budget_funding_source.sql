-- Adaugă dimensiunea "Sursă de finanțare" la bugetul anual.
-- Documentul oficial "BUGETUL PE ANUL ..." conține de fapt DOUĂ bugete separate,
-- pe aceleași coduri de indicatori (10.01.01, 20.01.01 etc.), dar cu sume diferite:
--   - VENITURI PROPRII (venituri + cheltuieli alocate din venituri proprii)
--   - BUGET DE STAT (doar cheltuieli alocate din bugetul de stat)
-- Script idempotent (verifica in INFORMATION_SCHEMA inainte de ALTER).

SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budget_annual_allocations' AND COLUMN_NAME = 'funding_source'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE budget_annual_allocations ADD COLUMN funding_source ENUM(''OWN_REVENUE'',''STATE_BUDGET'') NOT NULL DEFAULT ''OWN_REVENUE'' AFTER year',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Renunță la vechiul unique key (year, indicator_id) dacă încă există, ca să putem avea
-- aceeași combinație (year, indicator_id) pe surse de finanțare diferite.
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budget_annual_allocations' AND INDEX_NAME = 'uk_budget_alloc_year_indicator'
);
SET @sql := IF(@idx_exists > 0,
  'ALTER TABLE budget_annual_allocations DROP INDEX uk_budget_alloc_year_indicator',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budget_annual_allocations' AND INDEX_NAME = 'uk_budget_alloc_year_source_indicator'
);
SET @sql := IF(@idx_exists = 0,
  'ALTER TABLE budget_annual_allocations ADD UNIQUE KEY uk_budget_alloc_year_source_indicator (year, funding_source, indicator_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budget_annual_allocations' AND INDEX_NAME = 'idx_budget_alloc_source'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_budget_alloc_source ON budget_annual_allocations(funding_source)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
