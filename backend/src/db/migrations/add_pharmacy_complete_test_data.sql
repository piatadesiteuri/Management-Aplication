-- Date de test complete pentru toate funcționalitățile modulului Farmacie
SET NAMES utf8mb4;

-- Adaugă mișcări de stoc pentru a popula lista de mișcări
INSERT IGNORE INTO pharmacy_stock_movements 
(movement_date, storage_id, article_id, movement_type, quantity, unit_cost, total_value,
 document_type, document_id, document_number, batch_number, expiry_date, notes, performed_by)
SELECT 
  NOW() - INTERVAL FLOOR(RAND() * 30) DAY as movement_date,
  (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001' LIMIT 1) as storage_id,
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_001' LIMIT 1) as article_id,
  'IN' as movement_type,
  100 + RAND() * 200 as quantity,
  2.50 as unit_cost,
  (100 + RAND() * 200) * 2.50 as total_value,
  'ENTRY_NOTE' as document_type,
  1 as document_id,
  'NE001' as document_number,
  'BATCH001' as batch_number,
  '2026-12-31' as expiry_date,
  'Intrare inițială' as notes,
  (SELECT id FROM users LIMIT 1) as performed_by
UNION ALL
SELECT 
  NOW() - INTERVAL FLOOR(RAND() * 25) DAY,
  (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_002' LIMIT 1),
  'IN',
  50 + RAND() * 100,
  5.00,
  (50 + RAND() * 100) * 5.00,
  'ENTRY_NOTE',
  2,
  'NE002',
  'BATCH002',
  '2026-11-30',
  'Intrare inițială',
  (SELECT id FROM users LIMIT 1)
UNION ALL
SELECT 
  NOW() - INTERVAL FLOOR(RAND() * 20) DAY,
  (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_001' LIMIT 1),
  'OUT',
  10 + RAND() * 30,
  2.50,
  (10 + RAND() * 30) * 2.50,
  'REGISTER',
  1,
  'COND001',
  NULL,
  NULL,
  'Ieșire condică',
  (SELECT id FROM users LIMIT 1)
UNION ALL
SELECT 
  NOW() - INTERVAL FLOOR(RAND() * 15) DAY,
  (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_002' LIMIT 1),
  'OUT',
  5 + RAND() * 15,
  5.00,
  (5 + RAND() * 15) * 5.00,
  'PRESCRIPTION',
  1,
  'RET001',
  NULL,
  NULL,
  'Ieșire rețetă',
  (SELECT id FROM users LIMIT 1)
UNION ALL
SELECT 
  NOW() - INTERVAL FLOOR(RAND() * 10) DAY,
  (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_003' LIMIT 1),
  'TRANSFER_OUT',
  20 + RAND() * 30,
  8.50,
  (20 + RAND() * 30) * 8.50,
  'TRANSFER',
  1,
  'TRANS001',
  'BATCH003',
  '2026-10-31',
  'Transfer ieșire',
  (SELECT id FROM users LIMIT 1)
UNION ALL
SELECT 
  NOW() - INTERVAL FLOOR(RAND() * 10) DAY,
  (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_003' LIMIT 1),
  'TRANSFER_IN',
  20 + RAND() * 30,
  8.50,
  (20 + RAND() * 30) * 8.50,
  'TRANSFER',
  1,
  'TRANS001',
  'BATCH003',
  '2026-10-31',
  'Transfer intrare',
  (SELECT id FROM users LIMIT 1);

-- Adaugă elaborări de test
INSERT IGNORE INTO pharmacy_elaborations 
(elaboration_number, storage_id, elaboration_date, name, description, resulting_article_id, total_cost, resulting_quantity, status, notes, created_by)
VALUES
('ELAB001', 
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001' LIMIT 1),
 '2026-01-15',
 'Soluție Salină Compusă',
 'Elaborare soluție salină pentru preparate',
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_010' LIMIT 1),
 45.00,
 10.00,
 'COMPLETED',
 'Elaborare finalizată cu succes',
 (SELECT id FROM users LIMIT 1)),
('ELAB002',
 (SELECT id FROM pharmacy_storages WHERE code = 'GEST_003' LIMIT 1),
 '2026-01-20',
 'Unguent Antibiotic',
 'Elaborare unguent pentru tratament local',
 (SELECT id FROM pharmacy_articles WHERE code = 'ART_009' LIMIT 1),
 12.50,
 5.00,
 'DRAFT',
 'În curs de elaborare',
 (SELECT id FROM users LIMIT 1));

-- Adaugă items pentru elaborări
INSERT IGNORE INTO pharmacy_elaboration_items 
(elaboration_id, article_id, quantity, unit_cost, total_cost, line_number)
SELECT 
  (SELECT id FROM pharmacy_elaborations WHERE elaboration_number = 'ELAB001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_001' LIMIT 1),
  5.00,
  2.50,
  12.50,
  1
UNION ALL
SELECT 
  (SELECT id FROM pharmacy_elaborations WHERE elaboration_number = 'ELAB001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_006' LIMIT 1),
  10.00,
  0.50,
  5.00,
  2
UNION ALL
SELECT 
  (SELECT id FROM pharmacy_elaborations WHERE elaboration_number = 'ELAB001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_007' LIMIT 1),
  20.00,
  0.30,
  6.00,
  3
UNION ALL
SELECT 
  (SELECT id FROM pharmacy_elaborations WHERE elaboration_number = 'ELAB002' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_002' LIMIT 1),
  2.00,
  5.00,
  10.00,
  1
UNION ALL
SELECT 
  (SELECT id FROM pharmacy_elaborations WHERE elaboration_number = 'ELAB002' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_008' LIMIT 1),
  1.00,
  2.50,
  2.50,
  2;

-- Adaugă inițializări de stoc (minim 5 produse)
INSERT IGNORE INTO pharmacy_entry_notes 
(note_number, storage_id, supplier_id, entry_date, reception_date, document_number, document_date, total_value, notes, status, created_by)
SELECT 
  'INIT001',
  (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001' LIMIT 1),
  (SELECT id FROM pharmacy_suppliers LIMIT 1),
  '2026-01-10',
  '2026-01-10',
  CONCAT('INIT-', UNIX_TIMESTAMP('2026-01-10')),
  '2026-01-10',
  150.00,
  'Inițializare stoc inițial',
  'VALIDATED',
  (SELECT id FROM users LIMIT 1);

-- Adaugă items pentru inițializare (5 produse)
INSERT IGNORE INTO pharmacy_entry_note_items 
(entry_note_id, article_id, quantity, unit_cost, total_cost, batch_number, expiry_date, line_number)
SELECT 
  (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'INIT001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_001' LIMIT 1),
  50.00,
  2.50,
  125.00,
  'INIT_BATCH001',
  '2026-12-31',
  1
UNION ALL
SELECT 
  (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'INIT001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_002' LIMIT 1),
  20.00,
  5.00,
  100.00,
  'INIT_BATCH002',
  '2026-11-30',
  2
UNION ALL
SELECT 
  (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'INIT001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_003' LIMIT 1),
  10.00,
  8.50,
  85.00,
  'INIT_BATCH003',
  '2026-10-31',
  3
UNION ALL
SELECT 
  (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'INIT001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_006' LIMIT 1),
  100.00,
  0.50,
  50.00,
  'INIT_BATCH004',
  '2027-06-30',
  4
UNION ALL
SELECT 
  (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'INIT001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_007' LIMIT 1),
  200.00,
  0.30,
  60.00,
  'INIT_BATCH005',
  '2027-12-31',
  5;

-- Adaugă mișcări de stoc pentru inițializare
INSERT IGNORE INTO pharmacy_stock_movements 
(movement_date, storage_id, article_id, movement_type, quantity, unit_cost, total_value,
 document_type, document_id, document_number, batch_number, expiry_date, notes, performed_by)
SELECT 
  '2026-01-10',
  (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_001' LIMIT 1),
  'IN',
  50.00,
  2.50,
  125.00,
  'STOCK_INIT',
  (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'INIT001' LIMIT 1),
  'INIT001',
  'INIT_BATCH001',
  '2026-12-31',
  'Inițializare stoc',
  (SELECT id FROM users LIMIT 1)
UNION ALL
SELECT 
  '2026-01-10',
  (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_002' LIMIT 1),
  'IN',
  20.00,
  5.00,
  100.00,
  'STOCK_INIT',
  (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'INIT001' LIMIT 1),
  'INIT001',
  'INIT_BATCH002',
  '2026-11-30',
  'Inițializare stoc',
  (SELECT id FROM users LIMIT 1)
UNION ALL
SELECT 
  '2026-01-10',
  (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_003' LIMIT 1),
  'IN',
  10.00,
  8.50,
  85.00,
  'STOCK_INIT',
  (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'INIT001' LIMIT 1),
  'INIT001',
  'INIT_BATCH003',
  '2026-10-31',
  'Inițializare stoc',
  (SELECT id FROM users LIMIT 1)
UNION ALL
SELECT 
  '2026-01-10',
  (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_006' LIMIT 1),
  'IN',
  100.00,
  0.50,
  50.00,
  'STOCK_INIT',
  (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'INIT001' LIMIT 1),
  'INIT001',
  'INIT_BATCH004',
  '2027-06-30',
  'Inițializare stoc',
  (SELECT id FROM users LIMIT 1)
UNION ALL
SELECT 
  '2026-01-10',
  (SELECT id FROM pharmacy_storages WHERE code = 'GEST_001' LIMIT 1),
  (SELECT id FROM pharmacy_articles WHERE code = 'ART_007' LIMIT 1),
  'IN',
  200.00,
  0.30,
  60.00,
  'STOCK_INIT',
  (SELECT id FROM pharmacy_entry_notes WHERE note_number = 'INIT001' LIMIT 1),
  'INIT001',
  'INIT_BATCH005',
  '2027-12-31',
  'Inițializare stoc',
  (SELECT id FROM users LIMIT 1);
