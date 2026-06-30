-- Add calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    type VARCHAR(50) NOT NULL,
    user_id INT NOT NULL,
    department_id INT,
    is_private BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add departments table
CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add department_users table for department memberships
CREATE TABLE IF NOT EXISTS department_users (
    department_id INT NOT NULL,
    user_id INT NOT NULL,
    is_manager BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (department_id, user_id),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add foreign key to calendar_events for departments
ALTER TABLE calendar_events
ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Insert basic roles
INSERT INTO roles (name, description) VALUES
('SUPER_ADMIN', 'Administrator cu acces complet la sistem'),
('DEPARTMENT_ADMIN', 'Administrator de departament'),
('INSPECTOR', 'Inspector DSP cu acces la calendarul propriu și raportare'),
('MANAGER', 'Manager de departament'),
('OPERATOR', 'Operator date și documente'),
('VIEWER', 'Utilizator cu acces doar de vizualizare')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Insert basic departments
INSERT INTO departments (name, description) VALUES
('Administrativ', 'Departamentul administrativ'),
('Inspectie', 'Departamentul de inspecție și control'),
('Epidemiologie', 'Departamentul de epidemiologie'),
('Igiena', 'Departamentul de igienă')
ON DUPLICATE KEY UPDATE description = VALUES(description); 