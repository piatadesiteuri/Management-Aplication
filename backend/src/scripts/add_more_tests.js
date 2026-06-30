const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function addMoreTests() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'spital_brasov',
    port: Number(process.env.DB_PORT || 3306),
  });

  try {
    console.log('🧪 Adăugare teste suplimentare pentru demonstrație...\n');

    // Obține categoriile
    const [categories] = await connection.execute(
      'SELECT id, code FROM test_categories'
    );
    
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.code] = cat.id;
    });

    const additionalTests = [
      // Hematologie
      {
        category: 'HEM',
        name: 'VSH (Viteză de sedimentare eritrocitară)',
        code: 'HEM_VSH',
        description: 'Determinarea vitezei de sedimentare a eritrocitelor',
        sample_type: 'SANGE',
        unit: 'mm/h',
        duration: 1,
        normal_values: 'Bărbați: 0-15 mm/h, Femei: 0-20 mm/h'
      },
      {
        category: 'HEM',
        name: 'Leucocite',
        code: 'HEM_WBC',
        description: 'Numărătoare leucocite',
        sample_type: 'SANGE',
        unit: 'x10³/μL',
        duration: 1,
        normal_values: '4.0-11.0 x10³/μL'
      },
      {
        category: 'HEM',
        name: 'Hemoglobină',
        code: 'HEM_HGB',
        description: 'Determinarea concentrației de hemoglobină',
        sample_type: 'SANGE',
        unit: 'g/dL',
        duration: 1,
        normal_values: 'Bărbați: 13.5-17.5 g/dL, Femei: 12.0-15.5 g/dL'
      },
      {
        category: 'HEM',
        name: 'Hematocrit',
        code: 'HEM_HCT',
        description: 'Determinarea hematocritului',
        sample_type: 'SANGE',
        unit: '%',
        duration: 1,
        normal_values: 'Bărbați: 40-54%, Femei: 36-48%'
      },
      {
        category: 'HEM',
        name: 'Plaquete',
        code: 'HEM_PLT',
        description: 'Numărătoare plachete',
        sample_type: 'SANGE',
        unit: 'x10³/μL',
        duration: 1,
        normal_values: '150-450 x10³/μL'
      },
      
      // Biochimie
      {
        category: 'BIO',
        name: 'Colesterol total',
        code: 'BIO_CHOL',
        description: 'Determinarea colesterolului total',
        sample_type: 'SANGE',
        unit: 'mg/dL',
        duration: 2,
        normal_values: '<200 mg/dL'
      },
      {
        category: 'BIO',
        name: 'Trigliceride',
        code: 'BIO_TG',
        description: 'Determinarea trigliceridelor',
        sample_type: 'SANGE',
        unit: 'mg/dL',
        duration: 2,
        normal_values: '<150 mg/dL'
      },
      {
        category: 'BIO',
        name: 'Transaminază ALT',
        code: 'BIO_ALT',
        description: 'Determinarea alanine aminotransferazei',
        sample_type: 'SANGE',
        unit: 'U/L',
        duration: 2,
        normal_values: 'Bărbați: <41 U/L, Femei: <31 U/L'
      },
      {
        category: 'BIO',
        name: 'Transaminază AST',
        code: 'BIO_AST',
        description: 'Determinarea aspartat aminotransferazei',
        sample_type: 'SANGE',
        unit: 'U/L',
        duration: 2,
        normal_values: 'Bărbați: <40 U/L, Femei: <32 U/L'
      },
      {
        category: 'BIO',
        name: 'Bilirubină totală',
        code: 'BIO_BIL_TOTAL',
        description: 'Determinarea bilirubinei totale',
        sample_type: 'SANGE',
        unit: 'mg/dL',
        duration: 2,
        normal_values: '0.3-1.2 mg/dL'
      },
      {
        category: 'BIO',
        name: 'Proteină C reactivă (PCR)',
        code: 'BIO_CRP',
        description: 'Determinarea proteinei C reactive',
        sample_type: 'SANGE',
        unit: 'mg/L',
        duration: 2,
        normal_values: '<3 mg/L'
      },
      {
        category: 'BIO',
        name: 'Glicozilat hemoglobină (HbA1c)',
        code: 'BIO_HBA1C',
        description: 'Determinarea hemoglobinei glicozilate',
        sample_type: 'SANGE',
        unit: '%',
        duration: 3,
        normal_values: '<5.7%'
      },
      
      // Microbiologie
      {
        category: 'MICRO',
        name: 'Antibiogramă',
        code: 'MICRO_ANTIBIO',
        description: 'Test de sensibilitate la antibiotice',
        sample_type: 'SPUTA',
        unit: null,
        duration: 72,
        normal_values: 'Rezultat calitativ'
      },
      {
        category: 'MICRO',
        name: 'Examen direct',
        code: 'MICRO_DIRECT',
        description: 'Examen direct al probei',
        sample_type: 'SPUTA',
        unit: null,
        duration: 1,
        normal_values: 'Rezultat calitativ'
      },
      
      // Coagulare
      {
        category: 'COAG',
        name: 'Timp de protrombină (PT)',
        code: 'COAG_PT',
        description: 'Determinarea timpului de protrombină',
        sample_type: 'SANGE',
        unit: 'secunde',
        duration: 2,
        normal_values: '11-13 secunde'
      },
      {
        category: 'COAG',
        name: 'INR',
        code: 'COAG_INR',
        description: 'Raport normalizat internațional',
        sample_type: 'SANGE',
        unit: null,
        duration: 2,
        normal_values: '0.9-1.2'
      },
      {
        category: 'COAG',
        name: 'Timp de tromboplastină parțială (aPTT)',
        code: 'COAG_APTT',
        description: 'Determinarea timpului de tromboplastină parțială',
        sample_type: 'SANGE',
        unit: 'secunde',
        duration: 2,
        normal_values: '25-35 secunde'
      },
      
      // Imunologie
      {
        category: 'IMMUN',
        name: 'Test COVID-19 (PCR)',
        code: 'IMMUN_COVID_PCR',
        description: 'Test PCR pentru detectarea SARS-CoV-2',
        sample_type: 'SPUTA',
        unit: null,
        duration: 24,
        normal_values: 'Negativ'
      },
      {
        category: 'IMMUN',
        name: 'Test COVID-19 (Antigen rapid)',
        code: 'IMMUN_COVID_AG',
        description: 'Test rapid de antigene pentru COVID-19',
        sample_type: 'SPUTA',
        unit: null,
        duration: 1,
        normal_values: 'Negativ'
      }
    ];

    let added = 0;
    let skipped = 0;

    for (const test of additionalTests) {
      try {
        await connection.execute(
          `INSERT INTO laboratory_tests 
           (category_id, name, code, description, sample_type, unit, estimated_duration_hours, normal_values)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            categoryMap[test.category],
            test.name,
            test.code,
            test.description,
            test.sample_type,
            test.unit,
            test.duration,
            test.normal_values
          ]
        );
        console.log(`   ✅ ${test.name} (${test.code})`);
        added++;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`   ⚠️  ${test.name} - există deja`);
          skipped++;
        } else {
          console.error(`   ❌ Eroare la ${test.name}:`, error.message);
        }
      }
    }

    console.log(`\n📊 Rezumat:`);
    console.log(`   - Teste adăugate: ${added}`);
    console.log(`   - Teste existente: ${skipped}`);
    
    const [total] = await connection.execute('SELECT COUNT(*) as count FROM laboratory_tests');
    console.log(`   - Total teste în sistem: ${total[0].count}`);

  } catch (error) {
    console.error('❌ Eroare:', error.message);
  } finally {
    await connection.end();
  }
}

addMoreTests().catch(console.error);
