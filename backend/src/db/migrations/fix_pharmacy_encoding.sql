-- Corectează encoding-ul pentru datele farmaciei

-- Actualizează unitățile cu caractere corecte
UPDATE pharmacy_units SET 
  name = 'Spitalul Municipal Brașov',
  description = 'Spitalul principal al municipiului Brașov'
WHERE code = 'UNIT_001';

UPDATE pharmacy_units SET 
  name = 'Secția Farmacie Centrală',
  description = 'Secția de farmacie centrală'
WHERE code = 'UNIT_002';

UPDATE pharmacy_units SET 
  name = 'Secția Urgențe',
  description = 'Secția de urgențe'
WHERE code = 'UNIT_003';

-- Actualizează gestiunile
UPDATE pharmacy_storages SET 
  name = 'Depozit Principal',
  description = 'Depozitul principal al spitalului',
  responsible_person = 'Ion Popescu'
WHERE code = 'GEST_001';

UPDATE pharmacy_storages SET 
  name = 'Depozit Secundar',
  description = 'Depozit secundar pentru stocuri de rezervă',
  responsible_person = 'Maria Ionescu'
WHERE code = 'GEST_002';

UPDATE pharmacy_storages SET 
  name = 'Farmacie Centrală',
  description = 'Gestiunea farmaciei centrale',
  responsible_person = 'Ana Georgescu'
WHERE code = 'GEST_003';

UPDATE pharmacy_storages SET 
  name = 'Farmacie Urgențe',
  description = 'Gestiunea farmaciei de urgențe',
  responsible_person = 'Petru Vasilescu'
WHERE code = 'GEST_004';

-- Actualizează articolele
UPDATE pharmacy_articles SET 
  name = 'Paracetamol 500mg',
  description = 'Comprimate paracetamol 500mg'
WHERE code = 'ART_001';

UPDATE pharmacy_articles SET 
  name = 'Ibuprofen 400mg',
  description = 'Comprimate ibuprofen 400mg'
WHERE code = 'ART_002';

UPDATE pharmacy_articles SET 
  name = 'Amoxicilină 500mg',
  description = 'Capsule amoxicilină 500mg'
WHERE code = 'ART_003';

UPDATE pharmacy_articles SET 
  name = 'Morfina 10mg/ml',
  description = 'Soluție injectabilă morfină 10mg/ml'
WHERE code = 'ART_004';

UPDATE pharmacy_articles SET 
  name = 'Insulină Rapidă',
  description = 'Insulină acțiune rapidă 100 UI/ml'
WHERE code = 'ART_005';

UPDATE pharmacy_articles SET 
  name = 'Seringă 5ml',
  description = 'Seringă descărcabilă 5ml'
WHERE code = 'ART_006';

UPDATE pharmacy_articles SET 
  name = 'Ace 21G',
  description = 'Ace pentru injecție 21G'
WHERE code = 'ART_007';

UPDATE pharmacy_articles SET 
  name = 'Bandaj elastic 10cm',
  description = 'Bandaj elastic 10cm x 5m'
WHERE code = 'ART_008';

UPDATE pharmacy_articles SET 
  name = 'Gaze sterile 10x10cm',
  description = 'Gaze sterile 10x10cm'
WHERE code = 'ART_009';

UPDATE pharmacy_articles SET 
  name = 'Alcool izopropilic 70%',
  description = 'Alcool izopropilic 70% pentru dezinfectare'
WHERE code = 'ART_010';
