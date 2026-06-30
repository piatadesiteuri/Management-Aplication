-- Date de test pentru Modulul Farmacie

-- 1. Unități
INSERT INTO pharmacy_units (code, name, description, address, phone, email, is_active) VALUES
('UNIT_001', 'Spitalul Municipal Brașov', 'Spitalul principal al municipiului Brașov', 'Str. Republicii nr. 1, Brașov', '0268-123456', 'spital@brasov.ro', TRUE),
('UNIT_002', 'Secția Farmacie Centrală', 'Secția de farmacie centrală', 'Str. Republicii nr. 1, Brașov', '0268-123457', 'farmacie@brasov.ro', TRUE),
('UNIT_003', 'Secția Urgențe', 'Secția de urgențe', 'Str. Republicii nr. 1, Brașov', '0268-123458', 'urgente@brasov.ro', TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- 2. Gestiuni (pe fiecare unitate)
INSERT INTO pharmacy_storages (unit_id, code, name, description, storage_type, location, responsible_person, is_active) VALUES
((SELECT id FROM pharmacy_units WHERE code = 'UNIT_001'), 'GEST_001', 'Depozit Principal', 'Depozitul principal al spitalului', 'PRINCIPAL', 'Etaj 1, Corp A', 'Ion Popescu', TRUE),
((SELECT id FROM pharmacy_units WHERE code = 'UNIT_001'), 'GEST_002', 'Depozit Secundar', 'Depozit secundar pentru stocuri de rezervă', 'SECUNDAR', 'Etaj -1, Corp B', 'Maria Ionescu', TRUE),
((SELECT id FROM pharmacy_units WHERE code = 'UNIT_002'), 'GEST_003', 'Farmacie Centrală', 'Gestiunea farmaciei centrale', 'PRINCIPAL', 'Etaj 0, Corp C', 'Ana Georgescu', TRUE),
((SELECT id FROM pharmacy_units WHERE code = 'UNIT_003'), 'GEST_004', 'Farmacie Urgențe', 'Gestiunea farmaciei de urgențe', 'SECȚIE', 'Etaj 1, Corp D', 'Petru Vasilescu', TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- 3. Producători
INSERT INTO pharmacy_manufacturers (code, name, country, address, phone, email, is_active) VALUES
('MFR_001', 'Pfizer Romania', 'România', 'Bd. Expoziției nr. 1, București', '021-123456', 'contact@pfizer.ro', TRUE),
('MFR_002', 'Roche Romania', 'România', 'Str. Barbu Văcărescu nr. 164, București', '021-234567', 'contact@roche.ro', TRUE),
('MFR_003', 'Novartis Romania', 'România', 'Bd. Dimitrie Pompeiu nr. 5, București', '021-345678', 'contact@novartis.ro', TRUE),
('MFR_004', 'Sanofi Romania', 'România', 'Str. Gheorghe Manu nr. 1-3, București', '021-456789', 'contact@sanofi.ro', TRUE),
('MFR_005', 'Teva Romania', 'România', 'Str. Calea Floreasca nr. 169, București', '021-567890', 'contact@teva.ro', TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- 4. Articole (medicamente și materiale)
INSERT INTO pharmacy_articles (
  code, name, description, article_type_id, manufacturer_id, unit_of_measure_id,
  atc_code, cim_code, barcode, requires_prescription, is_controlled,
  min_stock_level, max_stock_level, is_active
) VALUES
-- Medicamente
('ART_001', 'Paracetamol 500mg', 'Comprimate paracetamol 500mg', 
 (SELECT id FROM pharmacy_article_types WHERE code = 'MEDICAMENT'),
 (SELECT id FROM pharmacy_manufacturers WHERE code = 'MFR_001'),
 (SELECT id FROM pharmacy_units_of_measure WHERE code = 'COMP'),
 'N02BE01', NULL, '5901234123457', FALSE, FALSE, 100, 1000, TRUE),

('ART_002', 'Ibuprofen 400mg', 'Comprimate ibuprofen 400mg', 
 (SELECT id FROM pharmacy_article_types WHERE code = 'MEDICAMENT'),
 (SELECT id FROM pharmacy_manufacturers WHERE code = 'MFR_002'),
 (SELECT id FROM pharmacy_units_of_measure WHERE code = 'COMP'),
 'M01AE01', NULL, '5901234123458', TRUE, FALSE, 50, 500, TRUE),

('ART_003', 'Amoxicilină 500mg', 'Capsule amoxicilină 500mg', 
 (SELECT id FROM pharmacy_article_types WHERE code = 'MEDICAMENT'),
 (SELECT id FROM pharmacy_manufacturers WHERE code = 'MFR_003'),
 (SELECT id FROM pharmacy_units_of_measure WHERE code = 'CAP'),
 'J01CA04', NULL, '5901234123459', TRUE, FALSE, 30, 300, TRUE),

('ART_004', 'Morfina 10mg/ml', 'Soluție injectabilă morfină 10mg/ml', 
 (SELECT id FROM pharmacy_article_types WHERE code = 'MEDICAMENT'),
 (SELECT id FROM pharmacy_manufacturers WHERE code = 'MFR_004'),
 (SELECT id FROM pharmacy_units_of_measure WHERE code = 'FL'),
 'N02AA01', NULL, '5901234123460', TRUE, TRUE, 10, 100, TRUE),

('ART_005', 'Insulină Rapidă', 'Insulină acțiune rapidă 100 UI/ml', 
 (SELECT id FROM pharmacy_article_types WHERE code = 'MEDICAMENT'),
 (SELECT id FROM pharmacy_manufacturers WHERE code = 'MFR_005'),
 (SELECT id FROM pharmacy_units_of_measure WHERE code = 'FL'),
 'A10AB01', NULL, '5901234123461', TRUE, TRUE, 20, 200, TRUE),

-- Materiale medicale
('ART_006', 'Seringă 5ml', 'Seringă descărcabilă 5ml', 
 (SELECT id FROM pharmacy_article_types WHERE code = 'MATERIAL_MEDICAL'),
 NULL,
 (SELECT id FROM pharmacy_units_of_measure WHERE code = 'BUC'),
 NULL, NULL, '5901234123462', FALSE, FALSE, 200, 2000, TRUE),

('ART_007', 'Ace 21G', 'Ace pentru injecție 21G', 
 (SELECT id FROM pharmacy_article_types WHERE code = 'MATERIAL_MEDICAL'),
 NULL,
 (SELECT id FROM pharmacy_units_of_measure WHERE code = 'BUC'),
 NULL, NULL, '5901234123463', FALSE, FALSE, 500, 5000, TRUE),

('ART_008', 'Bandaj elastic 10cm', 'Bandaj elastic 10cm x 5m', 
 (SELECT id FROM pharmacy_article_types WHERE code = 'MATERIAL_MEDICAL'),
 NULL,
 (SELECT id FROM pharmacy_units_of_measure WHERE code = 'BUC'),
 NULL, NULL, '5901234123464', FALSE, FALSE, 50, 500, TRUE),

('ART_009', 'Gaze sterile 10x10cm', 'Gaze sterile 10x10cm', 
 (SELECT id FROM pharmacy_article_types WHERE code = 'MATERIAL_MEDICAL'),
 NULL,
 (SELECT id FROM pharmacy_units_of_measure WHERE code = 'BUC'),
 NULL, NULL, '5901234123465', FALSE, FALSE, 100, 1000, TRUE),

('ART_010', 'Alcool izopropilic 70%', 'Alcool izopropilic 70% pentru dezinfectare', 
 (SELECT id FROM pharmacy_article_types WHERE code = 'MATERIAL_MEDICAL'),
 NULL,
 (SELECT id FROM pharmacy_units_of_measure WHERE code = 'L'),
 NULL, NULL, '5901234123466', FALSE, FALSE, 10, 100, TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- 5. Furnizori
INSERT INTO pharmacy_suppliers (
  code, name, fiscal_code, registration_number, address, phone, email,
  contact_person, payment_terms, delivery_terms, is_active
) VALUES
('FURN_001', 'Medica SRL', 'RO12345678', 'J40/1234/2020', 'Str. Industriei nr. 10, Brașov', '0268-111111', 'contact@medica.ro', 'Ion Popescu', '30 zile', 'Livrare în 3-5 zile lucrătoare', TRUE),
('FURN_002', 'Farma Distribuție SA', 'RO87654321', 'J12/5678/2019', 'Bd. Unirii nr. 25, București', '021-222222', 'contact@farmadist.ro', 'Maria Georgescu', '45 zile', 'Livrare în 5-7 zile lucrătoare', TRUE),
('FURN_003', 'MediTech Import Export', 'RO11223344', 'J40/9999/2021', 'Str. Comercială nr. 5, Brașov', '0268-333333', 'contact@meditech.ro', 'Petru Ionescu', '15 zile', 'Livrare în 2-3 zile lucrătoare', TRUE)
ON DUPLICATE KEY UPDATE name=name;
