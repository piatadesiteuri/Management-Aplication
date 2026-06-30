-- Adaugă date de stoc pentru a popula Stoc Curent și Mișcări Stoc
SET NAMES utf8mb4;

-- Re-inserează stocul inițial (actualizat după operațiunile de intrare/ieșire)
INSERT INTO pharmacy_stock (storage_id, article_id, quantity, unit_cost, expiry_date, batch_number) VALUES
-- Stoc în Depozit Principal (GEST_001) - după intrări și ieșiri
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 670, 2.50, '2026-12-31', 'BATCH001'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 230, 5.00, '2026-11-30', 'BATCH002'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_003'), 150, 8.50, '2026-10-31', 'BATCH003'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_006'), 800, 0.50, '2027-06-30', 'BATCH004'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_007'), 1700, 0.30, '2027-12-31', 'BATCH005'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_008'), 300, 3.00, '2027-08-31', 'BATCH006'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_009'), 500, 1.50, '2027-09-30', 'BATCH007'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_010'), 50, 15.00, '2027-12-31', 'BATCH008'),

-- Stoc în Farmacie Centrală (GEST_003) - după intrări, transferuri și ieșiri
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 220, 2.50, '2026-12-31', 'BATCH009'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 130, 5.00, '2026-11-30', 'BATCH010'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_003'), 56, 8.50, '2026-10-31', 'BATCH011'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_004'), 20, 25.00, '2026-09-30', 'BATCH012'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_005'), 50, 45.00, '2026-10-31', 'BATCH013'),

-- Stoc în Farmacie Urgențe (GEST_004) - după intrări, transferuri și ieșiri
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 100, 2.50, '2026-12-31', 'BATCH014'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 50, 5.00, '2026-11-30', 'BATCH015'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_003'), 0, 8.50, '2026-10-31', 'BATCH016'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_005'), 48, 45.00, '2026-10-31', 'BATCH017'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_006'), 690, 0.50, '2027-06-30', 'BATCH018'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'), (SELECT id FROM pharmacy_articles WHERE code = 'ART_007'), 1290, 0.30, '2027-12-31', 'BATCH019')
ON DUPLICATE KEY UPDATE 
  quantity = VALUES(quantity),
  unit_cost = VALUES(unit_cost),
  expiry_date = VALUES(expiry_date),
  batch_number = VALUES(batch_number);
