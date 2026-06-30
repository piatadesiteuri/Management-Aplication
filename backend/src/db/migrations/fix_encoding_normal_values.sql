-- Corectează encoding-ul pentru valorile normale
SET NAMES utf8mb4;

UPDATE laboratory_tests 
SET normal_values = '4.0-11.0 x10³/μL (leucocite), 13.5-17.5 g/dL (hemoglobină bărbați), 12.0-15.5 g/dL (hemoglobină femei), 40-54% (hematocrit bărbați), 36-48% (hematocrit femei), 150-450 x10³/μL (trombocite)' 
WHERE code = 'HEM_CBC';

UPDATE laboratory_tests 
SET name = 'Hemogramă completă'
WHERE code = 'HEM_CBC';

UPDATE laboratory_tests 
SET normal_values = 'pH: 4.6-8.0, Densitate: 1.005-1.030, Proteine: negativ, Glucoză: negativ, Hemoglobină: negativ, Leucocite: 0-5/câmp, Eritrocite: 0-3/câmp' 
WHERE code = 'BIO_URINE';
