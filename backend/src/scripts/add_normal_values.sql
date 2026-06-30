-- Adaugă valorile normale pentru teste de laborator
-- Format: "min-max" sau "min - max" sau "<max" sau ">min"

UPDATE laboratory_tests SET normal_values = '4.0-11.0 x10³/μL (leucocite), 13.5-17.5 g/dL (hemoglobină bărbați), 12.0-15.5 g/dL (hemoglobină femei), 40-54% (hematocrit bărbați), 36-48% (hematocrit femei), 150-450 x10³/μL (trombocite)' WHERE code = 'HEM_CBC';

UPDATE laboratory_tests SET normal_values = '70-100 mg/dL (glicemie în post), <140 mg/dL (glicemie după mese)' WHERE code = 'BIO_GLUCOSE';

UPDATE laboratory_tests SET normal_values = '0.6-1.2 mg/dL (bărbați), 0.5-1.1 mg/dL (femei)' WHERE code = 'BIO_CREATININE';

UPDATE laboratory_tests SET normal_values = '15-50 mg/dL' WHERE code = 'BIO_UREA';

UPDATE laboratory_tests SET normal_values = 'pH: 4.6-8.0, Densitate: 1.005-1.030, Proteine: negativ, Glucoză: negativ, Hemoglobina: negativ, Leucocite: 0-5/câmp, Eritrocite: 0-3/câmp' WHERE code = 'BIO_URINE';
