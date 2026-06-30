-- PAM: Istoric transferuri / mutări pacient în cadrul unui episod
-- "Rollback" clinic realist: nu ștergem, doar înregistrăm mutările și actualizăm locația curentă (department_id) pe episod.

CREATE TABLE IF NOT EXISTS patient_episode_transfers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  episode_id INT NOT NULL,
  from_department_id INT NULL,
  to_department_id INT NULL,
  reason VARCHAR(255) NULL,
  transferred_by INT NULL,
  transferred_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pet_episode (episode_id, transferred_at),
  INDEX idx_pet_from (from_department_id),
  INDEX idx_pet_to (to_department_id),
  FOREIGN KEY (episode_id) REFERENCES patient_episodes(id) ON DELETE CASCADE,
  FOREIGN KEY (from_department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (to_department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (transferred_by) REFERENCES users(id) ON DELETE SET NULL
);


