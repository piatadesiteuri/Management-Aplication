-- Inserez date de test pentru istoricul de mentenanță
INSERT INTO vehicle_maintenance (vehicle_id, date, type, description, cost, mileage, performed_by, status, priority) VALUES
(1, '2024-01-15', 'Revizie periodică', 'Schimb ulei motor, filtru ulei, filtru aer', 450.50, 45000, 'Service Auto Dolj', 'COMPLETED', 'MEDIUM'),
(1, '2023-12-10', 'Reparație', 'Înlocuire plăcuțe frână față', 320.00, 44200, 'Service Auto Dolj', 'COMPLETED', 'HIGH'),
(1, '2023-11-05', 'ITP', 'Inspecție tehnică periodică', 150.00, 43800, 'RAR Dolj', 'COMPLETED', 'CRITICAL'),
(1, '2023-09-20', 'Revizie periodică', 'Schimb ulei motor, filtru combustibil', 380.00, 42500, 'Service Auto Dolj', 'COMPLETED', 'MEDIUM'),
(1, '2023-08-15', 'Reparație', 'Înlocuire anvelope', 800.00, 42000, 'Vulcanizare Dolj', 'COMPLETED', 'HIGH');

-- Inserez date de test pentru istoricul de combustibil
INSERT INTO vehicle_fuel_records (vehicle_id, date, quantity, cost, mileage, fuel_type, location, driver, efficiency, cost_per_km) VALUES
(1, '2024-01-20', 45.5, 318.50, 45200, 'DIESEL', 'Petrom Craiova', 'Ion Popescu', 14.2, 0.65),
(1, '2024-01-05', 48.0, 336.00, 44800, 'DIESEL', 'OMV Dolj', 'Maria Ionescu', 13.8, 0.68),
(1, '2023-12-22', 50.0, 350.00, 44400, 'DIESEL', 'Rompetrol Craiova', 'Gheorghe Popescu', 14.0, 0.70),
(1, '2023-12-08', 42.0, 294.00, 44000, 'DIESEL', 'Petrom Craiova', 'Ion Popescu', 13.5, 0.67),
(1, '2023-11-25', 47.0, 329.00, 43600, 'DIESEL', 'OMV Dolj', 'Maria Ionescu', 14.5, 0.72);

-- Inserez date de test pentru istoricul de utilizare
INSERT INTO vehicle_usage_records (vehicle_id, user_id, start_date, end_date, start_mileage, end_mileage, purpose, route) VALUES
(1, 1, '2024-01-18', '2024-01-20', 45000, 45200, 'Inspecție în teren', 'Craiova - Calafat - Craiova'),
(1, 2, '2024-01-03', '2024-01-05', 44600, 44800, 'Transport personal medical', 'Craiova - Băilești - Craiova'),
(1, 1, '2023-12-20', '2023-12-22', 44200, 44400, 'Controale sanitare', 'Craiova - Segarcea - Dăbuleni - Craiova'),
(1, 3, '2023-12-06', '2023-12-08', 43800, 44000, 'Aprovizionare materiale', 'Craiova - București - Craiova'),
(1, 2, '2023-11-23', '2023-11-25', 43400, 43600, 'Inspecție unități sanitare', 'Craiova - Filiași - Motru - Craiova'); 