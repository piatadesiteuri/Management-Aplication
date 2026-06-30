-- Adaugă coloana request_id la tabela notifications
ALTER TABLE notifications 
ADD COLUMN request_id INT NULL,
ADD CONSTRAINT fk_notifications_request_id 
FOREIGN KEY (request_id) REFERENCES material_requests(id) ON DELETE SET NULL;
