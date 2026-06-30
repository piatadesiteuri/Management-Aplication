-- Insert departments if they don't exist
INSERT INTO departments (name, description) VALUES
('Departamentul de Inspecție și Control', 'Responsabil cu inspecțiile și controalele în unitățile sanitare'),
('Departamentul de Epidemiologie', 'Monitorizarea și controlul bolilor transmisibile'),
('Departamentul de Igiena Mediului', 'Supravegherea factorilor de mediu cu impact asupra sănătății'),
('Departamentul de Evaluare Factori de Risc', 'Evaluarea și monitorizarea factorilor de risc pentru sănătate')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Get the first user's ID (assuming it exists)
SET @user_id = (SELECT id FROM users LIMIT 1);

-- Link the user to departments
INSERT INTO department_users (department_id, user_id, is_manager) 
SELECT id, @user_id, TRUE 
FROM departments 
WHERE name IN ('Departamentul de Inspecție și Control', 'Departamentul de Epidemiologie')
ON DUPLICATE KEY UPDATE is_manager = VALUES(is_manager);

-- Verify the insertions
SELECT u.email, d.name as department_name, du.is_manager
FROM users u
JOIN department_users du ON u.id = du.user_id
JOIN departments d ON d.id = du.department_id
WHERE u.id = @user_id; 