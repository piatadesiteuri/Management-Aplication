-- Schema pentru Elaborări
-- Elaborările permit crearea de articole noi prin combinarea altor articole existente

CREATE TABLE IF NOT EXISTS pharmacy_elaborations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  elaboration_number VARCHAR(50) NOT NULL UNIQUE,
  storage_id INT NOT NULL,
  elaboration_date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  resulting_article_id INT, -- Articolul nou creat din elaborare
  total_cost DECIMAL(10, 2) DEFAULT 0,
  resulting_quantity DECIMAL(10, 2) NOT NULL,
  status ENUM('DRAFT', 'COMPLETED', 'CANCELLED') DEFAULT 'DRAFT',
  notes TEXT,
  created_by INT,
  completed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (storage_id) REFERENCES pharmacy_storages(id) ON DELETE RESTRICT,
  FOREIGN KEY (resulting_article_id) REFERENCES pharmacy_articles(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_elaborations_number (elaboration_number),
  INDEX idx_elaborations_storage (storage_id),
  INDEX idx_elaborations_status (status)
);

CREATE TABLE IF NOT EXISTS pharmacy_elaboration_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  elaboration_id INT NOT NULL,
  article_id INT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  line_number INT,
  FOREIGN KEY (elaboration_id) REFERENCES pharmacy_elaborations(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES pharmacy_articles(id) ON DELETE RESTRICT,
  INDEX idx_elaboration_items_elaboration (elaboration_id),
  INDEX idx_elaboration_items_article (article_id)
);
