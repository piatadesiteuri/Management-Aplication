-- Adaugă statusul APPROVED în ENUM pentru analysis_requests
ALTER TABLE analysis_requests 
MODIFY COLUMN status ENUM('DRAFT', 'SUBMITTED', 'RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'CANCELLED') DEFAULT 'DRAFT';
