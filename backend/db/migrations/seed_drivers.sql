-- Inserare șoferi de test
INSERT INTO drivers (first_name, last_name, cnp, license_number, phone, email, department_id, is_active) VALUES
('GHEORGHE', 'DIMIANU', '1234567890123', 'B123456', '0712345678', 'gheorghe.dimianu@dspd.ro', 1, TRUE),
('MARIAN', 'FUGACIU', '1234567890124', 'B123457', '0712345679', 'marian.fugaciu@dspd.ro', 1, TRUE),
('DANIEL', 'NICOLA', '1234567890125', 'B123458', '0712345680', 'daniel.nicola@dspd.ro', 1, TRUE),
('MIHAI', 'BANU', '1234567890126', 'B123459', '0712345681', 'mihai.banu@dspd.ro', 1, TRUE),
('FLORIN', 'IOVAN', '1234567890127', 'B123460', '0712345682', 'florin.iovan@dspd.ro', 1, TRUE),
('MIHAI', 'TENEA', '1234567890128', 'B123461', '0712345683', 'mihai.tenea@dspd.ro', 1, TRUE);

-- Asignare șoferi la vehicule (din tabelul vehicles existent)
INSERT INTO vehicle_drivers (vehicle_id, driver_id, assigned_date, is_active) 
SELECT v.id, d.id, CURDATE(), TRUE
FROM vehicles v
CROSS JOIN drivers d
WHERE v.registration_number IN ('DJ-01-DSP', 'DJ-02-DSP', 'DJ-03-DSP', 'DJ-04-DSP')
AND d.last_name IN ('DIMIANU', 'FUGACIU', 'NICOLA', 'BANU')
ON DUPLICATE KEY UPDATE is_active = TRUE;
