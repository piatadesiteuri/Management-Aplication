-- Modul: Buget & Execuție (instituții publice)
-- Scop: buget anual pe indicatori + cont de execuție zilnic (cheltuieli)

CREATE TABLE IF NOT EXISTS budget_indicators (
  id INT PRIMARY KEY AUTO_INCREMENT,
  indicator_type ENUM('REVENUE','EXPENSE') NOT NULL,
  capitol VARCHAR(10) NULL,
  subcapitol VARCHAR(10) NULL,
  paragraf VARCHAR(10) NULL,
  indicator_code VARCHAR(30) NOT NULL,
  name VARCHAR(500) NOT NULL,
  ca_cb VARCHAR(20) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_budget_indicator_code_type (indicator_type, indicator_code),
  INDEX idx_budget_indicators_type (indicator_type),
  INDEX idx_budget_indicators_active (is_active)
);

CREATE TABLE IF NOT EXISTS budget_annual_allocations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  year INT NOT NULL,
  indicator_id INT NOT NULL,
  amount DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_budget_alloc_year_indicator (year, indicator_id),
  INDEX idx_budget_alloc_year (year),
  FOREIGN KEY (indicator_id) REFERENCES budget_indicators(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS budget_execution_daily (
  id INT PRIMARY KEY AUTO_INCREMENT,
  exec_date DATE NOT NULL,
  indicator_id INT NOT NULL,
  -- Coloane conform formular "Contul de execuție - Cheltuieli"
  credits_initial DECIMAL(14,2) NOT NULL DEFAULT 0,
  credits_definitive DECIMAL(14,2) NOT NULL DEFAULT 0,
  commitments_budgetary DECIMAL(14,2) NOT NULL DEFAULT 0,
  commitments_legal DECIMAL(14,2) NOT NULL DEFAULT 0,
  payments_made DECIMAL(14,2) NOT NULL DEFAULT 0,
  commitments_legal_to_pay DECIMAL(14,2) NOT NULL DEFAULT 0,
  expenses_effective DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_by INT NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_budget_exec_date_indicator (exec_date, indicator_id),
  INDEX idx_budget_exec_date (exec_date),
  FOREIGN KEY (indicator_id) REFERENCES budget_indicators(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);


