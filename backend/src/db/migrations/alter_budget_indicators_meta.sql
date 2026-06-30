-- Extinde indicatorii bugetari cu meta-informații pentru randare (titluri/subtotaluri) si calcule (formule).
-- Script idempotent (verifica in INFORMATION_SCHEMA inainte de ALTER).

-- row_kind: LEAF (editabil), GROUP (subtotal), TITLE (titlu/rand informativ)
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budget_indicators' AND COLUMN_NAME = 'row_kind'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE budget_indicators ADD COLUMN row_kind VARCHAR(20) NOT NULL DEFAULT ''LEAF''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- calc_expression: ex "01+70+79" sau "10+20+30+..." (folosit in UI pentru calcule automate)
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budget_indicators' AND COLUMN_NAME = 'calc_expression'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE budget_indicators ADD COLUMN calc_expression VARCHAR(255) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- indent_level: nivel ierarhic pentru afisare (0 titlu, 1 titlu mare, 2 subgrup, 3 leaf etc.)
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budget_indicators' AND COLUMN_NAME = 'indent_level'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE budget_indicators ADD COLUMN indent_level INT NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- display_order: ordine fixa (ca in anexe). Daca lipseste, UI poate cadea pe order by cod.
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budget_indicators' AND COLUMN_NAME = 'display_order'
);
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE budget_indicators ADD COLUMN display_order INT NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index pentru ordonare rapida
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'budget_indicators' AND INDEX_NAME = 'idx_budget_indicators_order'
);
SET @sql := IF(@idx_exists = 0,
  'CREATE INDEX idx_budget_indicators_order ON budget_indicators(indicator_type, display_order)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


