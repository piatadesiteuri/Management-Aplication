-- Seed data pentru sistemul de supply chain
-- Șterge datele existente (pentru re-seeding)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE supplier_products;
TRUNCATE TABLE purchase_order_items;
TRUNCATE TABLE purchase_orders;
TRUNCATE TABLE stock_movements;
TRUNCATE TABLE inventory;
TRUNCATE TABLE products;
TRUNCATE TABLE product_categories;
TRUNCATE TABLE suppliers;
SET FOREIGN_KEY_CHECKS = 1;

-- Furnizori
INSERT INTO suppliers (name, code, contact_person, email, phone, address, city, tax_number, registration_number, status, payment_terms, delivery_time, rating, total_orders, total_value) VALUES
('MedSupply SRL', 'MSUP001', 'Ana Popescu', 'ana.popescu@medsupply.ro', '0251-123-456', 'Str. Medicală nr. 15', 'Craiova', 'RO12345678', 'J16/123/2020', 'ACTIVE', '30 zile', 5, 4.5, 45, 125000.00),
('Pharma Distribution', 'PHAR001', 'Ion Ionescu', 'ion.ionescu@pharma.ro', '0251-789-012', 'Bd. Magheru nr. 45', 'București', 'RO87654321', 'J40/456/2021', 'ACTIVE', '45 zile', 3, 4.2, 32, 89000.00),
('LabEquip Pro', 'LBEQ001', 'Maria Georgescu', 'maria@labequip.ro', '0251-345-678', 'Str. Industrială nr. 22', 'Craiova', 'RO11223344', 'J16/789/2022', 'ACTIVE', '60 zile', 7, 3.8, 12, 45000.00),
('BioMed Solutions', 'BMED001', 'Andrei Stoica', 'andrei@biomed.ro', '0251-567-890', 'Calea Bucureștilor nr. 88', 'Craiova', 'RO55667788', 'J16/456/2023', 'ACTIVE', '30 zile', 4, 4.1, 28, 67000.00),
('SafetyFirst Equipment', 'SAFE001', 'Elena Radu', 'elena@safetyfirst.ro', '0251-234-567', 'Str. Industriei nr. 12', 'Craiova', 'RO99887766', 'J16/234/2023', 'PENDING', '45 zile', 6, 3.9, 8, 23000.00);

-- Categorii de produse
INSERT INTO product_categories (name, description) VALUES
('Echipamente Medicale', 'Echipamente și instrumente medicale'),
('Consumabile Laborator', 'Materiale consumabile pentru laborator'),
('Produse Dezinfectante', 'Dezinfectante și produse de curățenie'),
('Medicamente', 'Medicamente și produse farmaceutice'),
('Echipamente Protecție', 'Echipamente de protecție individuală'),
('Instrumentar Chirurgical', 'Instrumente pentru chirurgie'),
('Aparatură Diagnosticare', 'Aparate pentru diagnosticare medicală'),
('Materiale Sanitare', 'Materiale sanitare și de îngrijire');

-- Produse
INSERT INTO products (name, code, description, category_id, unit, unit_price, min_stock, max_stock, reorder_point, manufacturer) VALUES
-- Echipamente Medicale
('Mănuși medicale', 'MED001', 'Mănuși medicale din latex, sterile', 1, 'cutie', 25.50, 50, 500, 100, 'MedSupply Co'),
('Măști chirurgicale', 'MED004', 'Măști chirurgicale de protecție', 1, 'cutie', 18.00, 100, 400, 150, 'SafetyMed'),
('Termometre cu mercur', 'MED005', 'Termometre medicale cu mercur', 1, 'bucată', 12.00, 20, 100, 30, 'ThermoMed'),
('Seringi sterile 5ml', 'MED006', 'Seringi sterile pentru injecții', 1, 'cutie', 35.00, 30, 200, 50, 'InjectSafe'),

-- Consumabile Laborator
('Seringi sterile 5ml', 'LAB002', 'Seringi sterile pentru laborator', 2, 'bucată', 1.20, 100, 1000, 200, 'LabTech'),
('Eprubete sticlă', 'LAB003', 'Eprubete din sticlă pentru analize', 2, 'set', 45.00, 20, 150, 40, 'GlassLab'),
('Pipete Pasteur', 'LAB004', 'Pipete Pasteur din plastic', 2, 'pachet', 15.00, 50, 300, 80, 'PlasticLab'),
('Lamele microscop', 'LAB005', 'Lamele pentru microscop', 2, 'cutie', 28.00, 25, 200, 50, 'MicroScope'),

-- Produse Dezinfectante
('Dezinfectant suprafețe', 'DESINF003', 'Dezinfectant pentru suprafețe', 3, 'litru', 15.00, 30, 200, 50, 'CleanPro'),
('Alcool etilic 70%', 'DESINF004', 'Alcool etilic pentru dezinfecție', 3, 'litru', 8.50, 50, 300, 80, 'AlcoholMed'),
('Betadină soluție', 'DESINF005', 'Soluție de betadină antiseptică', 3, 'flacon', 12.00, 40, 250, 70, 'AntisepticMed'),

-- Medicamente
('Paracetamol 500mg', 'DRUG001', 'Paracetamol comprimate 500mg', 4, 'cutie', 8.50, 100, 500, 150, 'PharmaCorp'),
('Ibuprofen 400mg', 'DRUG002', 'Ibuprofen comprimate 400mg', 4, 'cutie', 12.00, 80, 400, 120, 'PainRelief'),
('Amoxicilină 500mg', 'DRUG003', 'Amoxicilină capsules 500mg', 4, 'cutie', 15.00, 50, 300, 80, 'AntibioticMed'),

-- Echipamente Protecție
('Halate protecție', 'PROT001', 'Halate de protecție medicală', 5, 'bucată', 22.00, 30, 200, 50, 'ProtectMed'),
('Ochelari protecție', 'PROT002', 'Ochelari de protecție pentru laborator', 5, 'bucată', 18.00, 25, 150, 40, 'EyeProtect'),
('Bonete chirurgicale', 'PROT003', 'Bonete chirurgicale de unică folosință', 5, 'pachet', 25.00, 40, 250, 70, 'SurgicalWear'),

-- Instrumentar Chirurgical
('Bisturiu steril', 'CHIR001', 'Bisturiu steril de unică folosință', 6, 'bucată', 3.50, 200, 1000, 300, 'SurgicalTools'),
('Foarfecă chirurgicală', 'CHIR002', 'Foarfecă chirurgicală din inox', 6, 'bucată', 45.00, 10, 50, 20, 'SteelMed'),
('Pensetă chirurgicală', 'CHIR003', 'Pensetă chirurgicală din inox', 6, 'bucată', 35.00, 15, 80, 25, 'SteelMed'),

-- Aparatură Diagnosticare
('Stetoscop', 'DIAG001', 'Stetoscop pentru auscultație', 7, 'bucată', 120.00, 5, 30, 10, 'DiagnosticPro'),
('Tensiometru digital', 'DIAG002', 'Tensiometru digital automatic', 7, 'bucată', 85.00, 8, 40, 15, 'BloodPressure'),
('Pulsoximetru', 'DIAG003', 'Pulsoximetru pentru măsurarea saturației', 7, 'bucată', 65.00, 10, 50, 20, 'OxygenMed'),

-- Materiale Sanitare
('Vată medicală', 'SAN001', 'Vată medicală sterilă', 8, 'pachet', 8.00, 60, 400, 100, 'CottonMed'),
('Bandaje elastice', 'SAN002', 'Bandaje elastice pentru pansamente', 8, 'rola', 6.50, 80, 500, 150, 'BandageMed'),
('Comprese sterile', 'SAN003', 'Comprese sterile pentru pansamente', 8, 'pachet', 12.00, 50, 300, 80, 'CompressMed');

-- Inventar - stocuri curente pentru produse
INSERT INTO inventory (product_id, quantity, location, unit_cost, batch_number, expiry_date, notes) VALUES
-- Echipamente Medicale
(1, 150, 'Depozit A - Raft 1', 25.50, 'BATCH001', '2025-12-31', 'Stoc OK'),
(2, 480, 'Depozit A - Raft 1', 18.00, 'BATCH002', '2025-06-30', 'Stoc excesiv'),
(3, 5, 'Depozit B - Raft 3', 12.00, 'BATCH003', '2026-01-15', 'Stoc minim'),
(4, 25, 'Depozit B - Raft 3', 35.00, 'BATCH004', '2025-08-20', 'Stoc minim'),

-- Consumabile Laborator
(5, 25, 'Depozit B - Raft 3', 1.20, 'BATCH005', '2025-09-15', 'Stoc minim'),
(6, 35, 'Depozit C - Raft 2', 45.00, 'BATCH006', '2027-03-10', 'Stoc OK'),
(7, 120, 'Depozit C - Raft 2', 15.00, 'BATCH007', '2026-11-25', 'Stoc OK'),
(8, 45, 'Depozit C - Raft 2', 28.00, 'BATCH008', '2026-07-18', 'Stoc OK'),

-- Produse Dezinfectante
(9, 0, 'Depozit A - Raft 2', 15.00, 'BATCH009', '2025-04-30', 'Stoc epuizat'),
(10, 75, 'Depozit A - Raft 2', 8.50, 'BATCH010', '2025-12-01', 'Stoc OK'),
(11, 60, 'Depozit A - Raft 2', 12.00, 'BATCH011', '2025-10-15', 'Stoc OK'),

-- Medicamente
(12, 200, 'Depozit Medicamente', 8.50, 'BATCH012', '2025-11-30', 'Stoc OK'),
(13, 150, 'Depozit Medicamente', 12.00, 'BATCH013', '2025-09-22', 'Stoc OK'),
(14, 80, 'Depozit Medicamente', 15.00, 'BATCH014', '2025-07-10', 'Stoc OK'),

-- Echipamente Protecție
(15, 45, 'Depozit EPI', 22.00, 'BATCH015', '2026-02-28', 'Stoc OK'),
(16, 30, 'Depozit EPI', 18.00, 'BATCH016', '2027-01-20', 'Stoc OK'),
(17, 65, 'Depozit EPI', 25.00, 'BATCH017', '2025-12-15', 'Stoc OK'),

-- Instrumentar Chirurgical
(18, 350, 'Depozit Chirurgie', 3.50, 'BATCH018', '2025-08-30', 'Stoc OK'),
(19, 15, 'Depozit Chirurgie', 45.00, 'BATCH019', '2030-01-01', 'Stoc OK'),
(20, 20, 'Depozit Chirurgie', 35.00, 'BATCH020', '2030-01-01', 'Stoc OK'),

-- Aparatură Diagnosticare
(21, 8, 'Depozit Aparatură', 120.00, 'BATCH021', '2028-05-15', 'Stoc OK'),
(22, 12, 'Depozit Aparatură', 85.00, 'BATCH022', '2027-12-10', 'Stoc OK'),
(23, 18, 'Depozit Aparatură', 65.00, 'BATCH023', '2027-08-25', 'Stoc OK'),

-- Materiale Sanitare
(24, 120, 'Depozit Materiale', 8.00, 'BATCH024', '2026-03-20', 'Stoc OK'),
(25, 200, 'Depozit Materiale', 6.50, 'BATCH025', '2026-06-15', 'Stoc OK'),
(26, 90, 'Depozit Materiale', 12.00, 'BATCH026', '2025-11-08', 'Stoc OK');

-- Relații furnizor-produs
INSERT INTO supplier_products (supplier_id, product_id, supplier_code, unit_price, min_order_quantity, delivery_time, is_preferred) VALUES
-- MedSupply SRL
(1, 1, 'MS-MED001', 25.50, 10, 5, TRUE),
(1, 2, 'MS-MED004', 18.00, 20, 5, TRUE),
(1, 12, 'MS-DRUG001', 8.50, 50, 3, FALSE),
(1, 13, 'MS-DRUG002', 12.00, 30, 3, FALSE),
(1, 24, 'MS-SAN001', 8.00, 25, 4, TRUE),
(1, 25, 'MS-SAN002', 6.50, 40, 4, TRUE),

-- Pharma Distribution
(2, 5, 'PH-LAB002', 1.20, 100, 3, TRUE),
(2, 12, 'PH-DRUG001', 8.20, 100, 2, TRUE),
(2, 13, 'PH-DRUG002', 11.80, 50, 2, TRUE),
(2, 14, 'PH-DRUG003', 14.50, 25, 2, TRUE),

-- LabEquip Pro
(3, 5, 'LE-LAB002', 1.25, 50, 7, FALSE),
(3, 6, 'LE-LAB003', 45.00, 5, 7, TRUE),
(3, 7, 'LE-LAB004', 15.00, 20, 7, TRUE),
(3, 8, 'LE-LAB005', 28.00, 10, 7, TRUE),
(3, 21, 'LE-DIAG001', 120.00, 1, 10, TRUE),
(3, 22, 'LE-DIAG002', 85.00, 2, 10, TRUE),

-- BioMed Solutions
(4, 9, 'BM-DESINF003', 15.00, 20, 4, TRUE),
(4, 10, 'BM-DESINF004', 8.50, 30, 4, TRUE),
(4, 11, 'BM-DESINF005', 12.00, 15, 4, TRUE),
(4, 15, 'BM-PROT001', 22.00, 10, 5, TRUE),
(4, 16, 'BM-PROT002', 18.00, 15, 5, TRUE),

-- SafetyFirst Equipment
(5, 15, 'SF-PROT001', 21.50, 20, 6, FALSE),
(5, 16, 'SF-PROT002', 17.50, 25, 6, FALSE),
(5, 17, 'SF-PROT003', 24.00, 15, 6, TRUE),
(5, 18, 'SF-CHIR001', 3.40, 200, 6, FALSE),
(5, 19, 'SF-CHIR002', 44.00, 5, 8, FALSE);

-- Comenzi de achiziție exemple
INSERT INTO purchase_orders (order_number, supplier_id, status, order_date, expected_delivery_date, total_amount, tax_amount, final_amount, payment_terms, delivery_address, created_by, notes) VALUES
('PO-2024-001', 1, 'RECEIVED', '2024-01-15', '2024-01-20', 1250.00, 237.50, 1487.50, '30 zile', 'DSP Dolj, Str. Tabaci nr. 7, Craiova', 1, 'Comandă urgentă mănuși medicale'),
('PO-2024-002', 2, 'APPROVED', '2024-01-18', '2024-01-21', 850.00, 161.50, 1011.50, '45 zile', 'DSP Dolj, Str. Tabaci nr. 7, Craiova', 1, 'Medicamente pentru farmacie'),
('PO-2024-003', 3, 'PENDING', '2024-01-20', '2024-01-27', 450.00, 85.50, 535.50, '60 zile', 'DSP Dolj, Str. Tabaci nr. 7, Craiova', 1, 'Echipamente laborator'),
('PO-2024-004', 4, 'SENT', '2024-01-22', '2024-01-26', 320.00, 60.80, 380.80, '30 zile', 'DSP Dolj, Str. Tabaci nr. 7, Craiova', 1, 'Dezinfectante');

-- Articole pentru comenzile de achiziție
INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, received_quantity, notes) VALUES
-- PO-2024-001
(1, 1, 50, 25.00, 50, 'Livrat complet'),
(1, 2, 30, 18.00, 30, 'Livrat complet'),

-- PO-2024-002
(2, 12, 100, 8.50, 0, 'În așteptare'),
(2, 13, 50, 12.00, 0, 'În așteptare'),

-- PO-2024-003
(3, 6, 10, 45.00, 0, 'În așteptare'),
(3, 21, 1, 120.00, 0, 'În așteptare'),

-- PO-2024-004
(4, 9, 20, 15.00, 0, 'În transport'),
(4, 10, 40, 8.50, 0, 'În transport');

-- Mișcări de stoc exemple (nu se vor executa trigger-ele automat pentru că sunt INSERT direct)
-- Acestea sunt doar pentru istoric
INSERT INTO stock_movements (inventory_id, type, quantity, unit_cost, reference_document, reason, performed_by, movement_date, notes) VALUES
(1, 'IN', 100, 25.50, 'PO-2024-001', 'Achiziție nouă', 'Ana Popescu', '2024-01-20', 'Primire mănuși medicale'),
(1, 'OUT', 50, 25.50, 'REQ-001', 'Utilizare în departament', 'Ion Vasile', '2024-01-21', 'Cerere departament pediatrie'),
(2, 'IN', 500, 18.00, 'PO-2024-001', 'Achiziție nouă', 'Ana Popescu', '2024-01-20', 'Primire măști chirurgicale'),
(2, 'OUT', 20, 18.00, 'REQ-002', 'Utilizare în departament', 'Maria Ionescu', '2024-01-22', 'Cerere departament chirurgie'),
(9, 'OUT', 30, 15.00, 'REQ-003', 'Utilizare în departament', 'Andrei Stoica', '2024-01-18', 'Dezinfectare săli operație'),
(12, 'IN', 200, 8.50, 'PO-2023-045', 'Achiziție nouă', 'Elena Radu', '2024-01-10', 'Aprovizionare farmacie'),
(12, 'OUT', 50, 8.50, 'DISP-001', 'Eliberare către pacienți', 'Farmacist', '2024-01-15', 'Eliberare pe rețete'),
(18, 'IN', 500, 3.50, 'PO-2023-050', 'Achiziție nouă', 'Chirurg Șef', '2024-01-12', 'Aprovizionare bloc operator'),
(18, 'OUT', 150, 3.50, 'USE-001', 'Utilizare în chirurgie', 'Chirurg Șef', '2024-01-19', 'Intervenții chirurgicale'); 