-- Date de test comprehensive pentru Modulul Farmacie
-- Acest script adaugă date pentru toate modulele: Note de Intrare, Condici, Rețete, Note de Transfer, Elaborări, Stoc, etc.

SET NAMES utf8mb4;

-- Verifică dacă există deja date și le șterge pentru a re-insera
DELETE FROM pharmacy_stock_movements;
DELETE FROM pharmacy_stock;
DELETE FROM pharmacy_prescription_items;
DELETE FROM pharmacy_prescriptions;
DELETE FROM pharmacy_register_items;
DELETE FROM pharmacy_registers;
DELETE FROM pharmacy_entry_note_items;
DELETE FROM pharmacy_entry_notes;

-- 1. NOTE DE INTRARE (Entry Notes)
-- Adaugă 3 note de intrare cu articole
INSERT INTO pharmacy_entry_notes (
  note_number, storage_id, supplier_id, entry_date, reception_date,
  document_number, document_date, total_value, notes, status, created_by
) VALUES
-- Nota de intrare 1
('NI-001/2026',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), 
 (SELECT id FROM pharmacy_suppliers WHERE code = 'FURN_001'),
 '2026-01-15', '2026-01-15',
 'FAC-2026-001', '2026-01-10', 2500.00, 'Prima livrare de la Medica SRL', 'VALIDATED', 1),
-- Nota de intrare 2
('NI-002/2026',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'), 
 (SELECT id FROM pharmacy_suppliers WHERE code = 'FURN_002'),
 '2026-01-20', '2026-01-20',
 'FAC-2026-002', '2026-01-18', 1800.00, 'Livrare materiale medicale', 'VALIDATED', 1),
-- Nota de intrare 3
('NI-003/2026',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'), 
 (SELECT id FROM pharmacy_suppliers WHERE code = 'FURN_003'),
 '2026-01-25', '2026-01-25',
 'FAC-2026-003', '2026-01-22', 3200.00, 'Medicamente pentru farmacia centrală', 'VALIDATED', 1);

-- Articole pentru Note de Intrare
INSERT INTO pharmacy_entry_note_items (
  entry_note_id, article_id, quantity, unit_cost, total_cost, batch_number, expiry_date, line_number
) VALUES
-- Articole pentru NI-001
((SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-001/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 200, 2.50, 500.00, 'BATCH-NI-001', '2026-12-31', 1),
((SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-001/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 100, 5.00, 500.00, 'BATCH-NI-002', '2026-11-30', 2),
((SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-001/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_006'), 500, 0.50, 250.00, 'BATCH-NI-003', '2027-06-30', 3),
-- Articole pentru NI-002
((SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-002/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_007'), 1000, 0.30, 300.00, 'BATCH-NI-004', '2027-12-31', 1),
((SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-002/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_008'), 200, 3.00, 600.00, 'BATCH-NI-005', '2027-08-31', 2),
((SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-002/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_009'), 300, 1.50, 450.00, 'BATCH-NI-006', '2027-09-30', 3),
-- Articole pentru NI-003
((SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-003/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 150, 2.50, 375.00, 'BATCH-NI-007', '2026-12-31', 1),
((SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-003/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_003'), 80, 8.50, 680.00, 'BATCH-NI-008', '2026-10-31', 2),
((SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-003/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_004'), 20, 25.00, 500.00, 'BATCH-NI-009', '2026-09-30', 3);

-- 2. CONDICI (Registers)
-- Adaugă 2 condici
INSERT INTO pharmacy_registers (
  register_number, storage_id, register_date, 
  patient_name, patient_identity, doctor_name, prescription_number, total_value, notes, status, issued_by, issued_at, created_by
) VALUES
-- Condica 1
('COND-001/2026',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'),
 '2026-01-16',
 'Ion Popescu', '1234567890123', 'Dr. Maria Ionescu', 'PRES-001/2026', 175.00, 'Condică pentru tratament cronic', 'ISSUED', 1, '2026-01-16 10:00:00', 1),
-- Condica 2
('COND-002/2026',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'),
 '2026-01-18',
 'Ana Georgescu', '9876543210987', 'Dr. Petru Vasilescu', 'PRES-002/2026', 95.00, 'Condică pentru insulină', 'ISSUED', 1, '2026-01-18 14:30:00', 1);

-- Articole pentru Condici
INSERT INTO pharmacy_register_items (
  register_id, article_id, quantity, unit_price, total_price, line_number
) VALUES
-- Articole pentru COND-001
((SELECT id FROM pharmacy_registers WHERE register_number = 'COND-001/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 30, 2.50, 75.00, 1),
((SELECT id FROM pharmacy_registers WHERE register_number = 'COND-001/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 20, 5.00, 100.00, 2),
-- Articole pentru COND-002
((SELECT id FROM pharmacy_registers WHERE register_number = 'COND-002/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_005'), 2, 45.00, 90.00, 1),
((SELECT id FROM pharmacy_registers WHERE register_number = 'COND-002/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_006'), 10, 0.50, 5.00, 2);

-- 3. REȚETE (Prescriptions)
-- Adaugă 3 rețete
INSERT INTO pharmacy_prescriptions (
  prescription_number, storage_id, prescription_date,
  patient_name, patient_identity, patient_age, patient_gender, doctor_name, doctor_specialty, diagnosis, total_value, notes, status, dispensed_by, dispensed_at, created_by
) VALUES
-- Rețeta 1
('RET-001/2026',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'),
 '2026-01-17',
 'Petru Ionescu', '1112223334445', 45, 'M', 'Dr. Ana Popescu', 'Medicină generală', 'Infecție respiratorie', 119.00, 'Tratament antibiotic', 'DISPENSED', 1, '2026-01-17 11:00:00', 1),
-- Rețeta 2
('RET-002/2026',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'),
 '2026-01-19',
 'Maria Vasilescu', '5556667778889', 38, 'F', 'Dr. Ion Georgescu', 'Medicină generală', 'Durere cronică', 100.00, 'Analgezice', 'DISPENSED', 1, '2026-01-19 09:30:00', 1),
-- Rețeta 3
('RET-003/2026',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'),
 '2026-01-21',
 'Gheorghe Popescu', '9998887776665', 52, 'M', 'Dr. Elena Ionescu', 'Urologie', 'Infecție urinară', 85.00, 'Antibiotic', 'DISPENSED', 1, '2026-01-21 15:45:00', 1);

-- Articole pentru Rețete
INSERT INTO pharmacy_prescription_items (
  prescription_id, article_id, quantity, unit_price, total_price, dosage, administration_route, frequency, duration_days, line_number
) VALUES
-- Articole pentru RET-001
((SELECT id FROM pharmacy_prescriptions WHERE prescription_number = 'RET-001/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_003'), 14, 8.50, 119.00, '500mg', 'Oral', '2x pe zi', 7, 1),
-- Articole pentru RET-002
((SELECT id FROM pharmacy_prescriptions WHERE prescription_number = 'RET-002/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 20, 2.50, 50.00, '500mg', 'Oral', '3x pe zi', NULL, 1),
((SELECT id FROM pharmacy_prescriptions WHERE prescription_number = 'RET-002/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 10, 5.00, 50.00, '400mg', 'Oral', '2x pe zi', NULL, 2),
-- Articole pentru RET-003
((SELECT id FROM pharmacy_prescriptions WHERE prescription_number = 'RET-003/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_003'), 10, 8.50, 85.00, '500mg', 'Oral', '2x pe zi', 5, 1);

-- 4. NOTE DE TRANSFER (Transfer Notes)
-- Pentru note de transfer, folosim pharmacy_entry_notes cu un supplier_id NULL sau un supplier special
-- Adaugă 2 note de transfer între gestiuni (folosim supplier_id NULL și document_number pentru identificare)
INSERT INTO pharmacy_entry_notes (
  note_number, storage_id, supplier_id, entry_date, reception_date,
  document_number, document_date, total_value, notes, status, created_by
) VALUES
-- Nota de transfer 1: GEST_001 -> GEST_003
('NT-001/2026',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'), 
 (SELECT id FROM pharmacy_suppliers WHERE code = 'FURN_001'), -- Folosim un supplier pentru a respecta NOT NULL
 '2026-01-22', '2026-01-22',
 'TRANSFER-001', '2026-01-22', 500.00, 'Transfer medicamente către farmacia centrală', 'VALIDATED', 1),
-- Nota de transfer 2: GEST_001 -> GEST_004
('NT-002/2026',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'), 
 (SELECT id FROM pharmacy_suppliers WHERE code = 'FURN_001'), -- Folosim un supplier pentru a respecta NOT NULL
 '2026-01-24', '2026-01-24',
 'TRANSFER-002', '2026-01-24', 300.00, 'Transfer materiale către farmacia urgențe', 'VALIDATED', 1);

-- Articole pentru Note de Transfer
INSERT INTO pharmacy_entry_note_items (
  entry_note_id, article_id, quantity, unit_cost, total_cost, batch_number, expiry_date, line_number
) VALUES
-- Articole pentru NT-001
((SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NT-001/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 100, 2.50, 250.00, 'BATCH-TRANSFER-001', '2026-12-31', 1),
((SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NT-001/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 50, 5.00, 250.00, 'BATCH-TRANSFER-002', '2026-11-30', 2),
-- Articole pentru NT-002
((SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NT-002/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_006'), 200, 0.50, 100.00, 'BATCH-TRANSFER-003', '2027-06-30', 1),
((SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NT-002/2026'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_007'), 300, 0.30, 90.00, 'BATCH-TRANSFER-004', '2027-12-31', 2);

-- 5. ELABORĂRI (Elaborations)
-- Pentru elaborări, trebuie să creăm un articol nou de tip elaborare și să scădem articolele componente
-- Vom crea un articol de elaborare și apoi o înregistrare de elaborare
-- (Notă: Schema pentru elaborări nu este definită în migrații, deci vom folosi o abordare simplificată)

-- 6. ACTUALIZARE STOC (după toate operațiunile)
-- Actualizează stocul pentru a reflecta intrările și ieșirile
-- Stocul inițial a fost deja inserat, acum trebuie actualizat cu mișcările

-- Mișcări de stoc pentru Note de Intrare
INSERT INTO pharmacy_stock_movements (
  movement_date, storage_id, article_id, movement_type, quantity, unit_cost, total_value,
  document_type, document_id, document_number, batch_number, expiry_date, notes, performed_by
) VALUES
-- Mișcări pentru NI-001
('2026-01-15 08:00:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 'IN', 200, 2.50, 500.00,
 'ENTRY_NOTE', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-001/2026'), 'NI-001/2026', 'BATCH-NI-001', '2026-12-31', 'Intrare stoc', 1),
('2026-01-15 08:00:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 'IN', 100, 5.00, 500.00,
 'ENTRY_NOTE', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-001/2026'), 'NI-001/2026', 'BATCH-NI-002', '2026-11-30', 'Intrare stoc', 1),
('2026-01-15 08:00:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_006'), 'IN', 500, 0.50, 250.00,
 'ENTRY_NOTE', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-001/2026'), 'NI-001/2026', 'BATCH-NI-003', '2027-06-30', 'Intrare stoc', 1),
-- Mișcări pentru NI-002
('2026-01-20 09:00:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_007'), 'IN', 1000, 0.30, 300.00,
 'ENTRY_NOTE', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-002/2026'), 'NI-002/2026', 'BATCH-NI-004', '2027-12-31', 'Intrare stoc', 1),
('2026-01-20 09:00:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_008'), 'IN', 200, 3.00, 600.00,
 'ENTRY_NOTE', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-002/2026'), 'NI-002/2026', 'BATCH-NI-005', '2027-08-31', 'Intrare stoc', 1),
('2026-01-20 09:00:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_009'), 'IN', 300, 1.50, 450.00,
 'ENTRY_NOTE', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-002/2026'), 'NI-002/2026', 'BATCH-NI-006', '2027-09-30', 'Intrare stoc', 1),
-- Mișcări pentru NI-003
('2026-01-25 10:00:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 'IN', 150, 2.50, 375.00,
 'ENTRY_NOTE', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-003/2026'), 'NI-003/2026', 'BATCH-NI-007', '2026-12-31', 'Intrare stoc', 1),
('2026-01-25 10:00:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_003'), 'IN', 80, 8.50, 680.00,
 'ENTRY_NOTE', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-003/2026'), 'NI-003/2026', 'BATCH-NI-008', '2026-10-31', 'Intrare stoc', 1),
('2026-01-25 10:00:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_004'), 'IN', 20, 25.00, 500.00,
 'ENTRY_NOTE', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NI-003/2026'), 'NI-003/2026', 'BATCH-NI-009', '2026-09-30', 'Intrare stoc', 1),
-- Mișcări pentru Condici (IEȘIRI)
('2026-01-16 10:00:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 'OUT', 30, 2.50, 75.00,
 'REGISTER', (SELECT id FROM pharmacy_registers WHERE register_number = 'COND-001/2026'), 'COND-001/2026', NULL, NULL, 'Ieșire condică', 1),
('2026-01-16 10:00:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 'OUT', 20, 5.00, 100.00,
 'REGISTER', (SELECT id FROM pharmacy_registers WHERE register_number = 'COND-001/2026'), 'COND-001/2026', NULL, NULL, 'Ieșire condică', 1),
('2026-01-18 14:30:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_005'), 'OUT', 2, 45.00, 90.00,
 'REGISTER', (SELECT id FROM pharmacy_registers WHERE register_number = 'COND-002/2026'), 'COND-002/2026', NULL, NULL, 'Ieșire condică', 1),
('2026-01-18 14:30:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_006'), 'OUT', 10, 0.50, 5.00,
 'REGISTER', (SELECT id FROM pharmacy_registers WHERE register_number = 'COND-002/2026'), 'COND-002/2026', NULL, NULL, 'Ieșire condică', 1),
-- Mișcări pentru Rețete (IEȘIRI)
('2026-01-17 11:00:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_003'), 'OUT', 14, 8.50, 119.00,
 'PRESCRIPTION', (SELECT id FROM pharmacy_prescriptions WHERE prescription_number = 'RET-001/2026'), 'RET-001/2026', NULL, NULL, 'Ieșire rețetă', 1),
('2026-01-19 09:30:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 'OUT', 20, 2.50, 50.00,
 'PRESCRIPTION', (SELECT id FROM pharmacy_prescriptions WHERE prescription_number = 'RET-002/2026'), 'RET-002/2026', NULL, NULL, 'Ieșire rețetă', 1),
('2026-01-19 09:30:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 'OUT', 10, 5.00, 50.00,
 'PRESCRIPTION', (SELECT id FROM pharmacy_prescriptions WHERE prescription_number = 'RET-002/2026'), 'RET-002/2026', NULL, NULL, 'Ieșire rețetă', 1),
('2026-01-21 15:45:00',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_003'), 'OUT', 10, 8.50, 85.00,
 'PRESCRIPTION', (SELECT id FROM pharmacy_prescriptions WHERE prescription_number = 'RET-003/2026'), 'RET-003/2026', NULL, NULL, 'Ieșire rețetă', 1),
-- Mișcări pentru Note de Transfer
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 'TRANSFER_OUT', 100, 2.50,
 'TRANSFER', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NT-001/2026'), 'NT-001/2026', '2026-01-22 10:00:00', 'BATCH-TRANSFER-001', 'Transfer ieșire'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 'TRANSFER_OUT', 50, 5.00,
 'TRANSFER', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NT-001/2026'), 'NT-001/2026', '2026-01-22 10:00:00', 'BATCH-TRANSFER-002', 'Transfer ieșire'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_001'), 'TRANSFER_IN', 100, 2.50,
 'TRANSFER', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NT-001/2026'), 'NT-001/2026', '2026-01-22 10:00:00', 'BATCH-TRANSFER-001', 'Transfer intrare'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_003'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_002'), 'TRANSFER_IN', 50, 5.00,
 'TRANSFER', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NT-001/2026'), 'NT-001/2026', '2026-01-22 10:00:00', 'BATCH-TRANSFER-002', 'Transfer intrare'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_006'), 'TRANSFER_OUT', 200, 0.50,
 'TRANSFER', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NT-002/2026'), 'NT-002/2026', '2026-01-24 14:00:00', 'BATCH-TRANSFER-003', 'Transfer ieșire'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_001'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_007'), 'TRANSFER_OUT', 300, 0.30,
 'TRANSFER', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NT-002/2026'), 'NT-002/2026', '2026-01-24 14:00:00', 'BATCH-TRANSFER-004', 'Transfer ieșire'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_006'), 'TRANSFER_IN', 200, 0.50,
 'TRANSFER', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NT-002/2026'), 'NT-002/2026', '2026-01-24 14:00:00', 'BATCH-TRANSFER-003', 'Transfer intrare'),
((SELECT id FROM pharmacy_storages WHERE code = 'GEST_004'),
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_007'), 'TRANSFER_IN', 300, 0.30,
 'TRANSFER', (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'NT-002/2026'), 'NT-002/2026', '2026-01-24 14:00:00', 'BATCH-TRANSFER-004', 'Transfer intrare');
