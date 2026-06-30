const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function seedDemoData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'spital_brasov',
    port: Number(process.env.DB_PORT || 3306),
  });

  try {
    console.log('🌱 Seeding LIMS demo data...\n');

    // 1. Verifică și creează pacienți demo
    console.log('📋 Verificare pacienți...');
    const [patients] = await connection.execute('SELECT COUNT(*) as count FROM patients');
    const patientCount = patients[0].count;

    if (patientCount < 5) {
      console.log(`   Găsiți ${patientCount} pacienți. Adăugăm pacienți demo...`);
      
      const demoPatients = [
        {
          identity_type: 'CNP',
          identity_number: '1900101123456',
          first_name: 'Ion',
          last_name: 'Popescu',
          date_of_birth: '1990-01-01',
          gender: 'M',
          contact_data: JSON.stringify({
            phone: '0721234567',
            email: 'ion.popescu@email.ro',
            address: 'Str. Principală nr. 10, Brașov'
          }),
          insurance_status_current: 'ASIGURAT'
        },
        {
          identity_type: 'CNP',
          identity_number: '2850302234567',
          first_name: 'Maria',
          last_name: 'Ionescu',
          date_of_birth: '1985-03-02',
          gender: 'F',
          contact_data: JSON.stringify({
            phone: '0722345678',
            email: 'maria.ionescu@email.ro',
            address: 'Str. Libertății nr. 25, Brașov'
          }),
          insurance_status_current: 'ASIGURAT'
        },
        {
          identity_type: 'CNP',
          identity_number: '1950512345678',
          first_name: 'Gheorghe',
          last_name: 'Georgescu',
          date_of_birth: '1995-05-12',
          gender: 'M',
          contact_data: JSON.stringify({
            phone: '0723456789',
            email: 'gheorghe.georgescu@email.ro',
            address: 'Str. Unirii nr. 5, Brașov'
          }),
          insurance_status_current: 'ASIGURAT'
        },
        {
          identity_type: 'CNP',
          identity_number: '2900715456789',
          first_name: 'Elena',
          last_name: 'Dumitrescu',
          date_of_birth: '1990-07-15',
          gender: 'F',
          contact_data: JSON.stringify({
            phone: '0724567890',
            email: 'elena.dumitrescu@email.ro',
            address: 'Str. Mihai Eminescu nr. 30, Brașov'
          }),
          insurance_status_current: 'ASIGURAT'
        },
        {
          identity_type: 'CNP',
          identity_number: '1980812567890',
          first_name: 'Alexandru',
          last_name: 'Constantinescu',
          date_of_birth: '1998-08-12',
          gender: 'M',
          contact_data: JSON.stringify({
            phone: '0725678901',
            email: 'alexandru.constantinescu@email.ro',
            address: 'Str. Republicii nr. 15, Brașov'
          }),
          insurance_status_current: 'ASIGURAT'
        }
      ];

      for (const patient of demoPatients) {
        try {
          await connection.execute(
            `INSERT INTO patients 
             (identity_type, identity_number, first_name, last_name, date_of_birth, gender, contact_data, insurance_status_current, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              patient.identity_type,
              patient.identity_number,
              patient.first_name,
              patient.last_name,
              patient.date_of_birth,
              patient.gender,
              patient.contact_data,
              patient.insurance_status_current
            ]
          );
          console.log(`   ✅ Pacient adăugat: ${patient.first_name} ${patient.last_name}`);
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            console.log(`   ⚠️  Pacient există deja: ${patient.first_name} ${patient.last_name}`);
          } else {
            console.error(`   ❌ Eroare la adăugarea pacientului ${patient.first_name}:`, error.message);
          }
        }
      }
    } else {
      console.log(`   ✅ Există deja ${patientCount} pacienți`);
    }

    // 2. Verifică și creează medici de laborator
    console.log('\n👨‍⚕️ Verificare medici de laborator...');
    const [labs] = await connection.execute('SELECT id FROM laboratories LIMIT 1');
    if (labs.length > 0) {
      const labId = labs[0].id;
      const [doctors] = await connection.execute(
        'SELECT COUNT(*) as count FROM laboratory_doctors WHERE laboratory_id = ?',
        [labId]
      );

      if (doctors[0].count === 0) {
        // Găsește utilizatori activi care pot fi medici
        const [users] = await connection.execute(
          'SELECT id FROM users WHERE is_active = 1 LIMIT 2'
        );

        if (users.length > 0) {
          for (let i = 0; i < Math.min(users.length, 2); i++) {
            try {
              await connection.execute(
                'INSERT INTO laboratory_doctors (laboratory_id, user_id, is_responsible, specialization) VALUES (?, ?, ?, ?)',
                [labId, users[i].id, i === 0, 'Medic de laborator']
              );
              console.log(`   ✅ Medic adăugat la laborator (Responsabil: ${i === 0})`);
            } catch (error) {
              if (error.code !== 'ER_DUP_ENTRY') {
                console.error('   ❌ Eroare la adăugarea medicului:', error.message);
              }
            }
          }
        }
      } else {
        console.log(`   ✅ Există deja ${doctors[0].count} medici de laborator`);
      }
    }

    // 3. Verifică teste
    console.log('\n🧪 Verificare teste...');
    const [tests] = await connection.execute('SELECT COUNT(*) as count FROM laboratory_tests');
    console.log(`   ✅ Există ${tests[0].count} teste disponibile`);

    // 4. Creează cereri de analize demo (dacă nu există)
    console.log('\n📝 Verificare cereri de analize demo...');
    const [requests] = await connection.execute('SELECT COUNT(*) as count FROM analysis_requests');
    
    if (requests[0].count === 0) {
      console.log('   Adăugăm cereri demo...');
      
      // Obține primul pacient și laborator
      const [patientsList] = await connection.execute('SELECT id FROM patients LIMIT 1');
      const [labsList] = await connection.execute('SELECT id FROM laboratories LIMIT 1');
      const [testsList] = await connection.execute('SELECT id FROM laboratory_tests LIMIT 3');

      if (patientsList.length > 0 && labsList.length > 0 && testsList.length > 0) {
        const patientId = patientsList[0].id;
        const labId = labsList[0].id;
        const testIds = testsList.map(t => t.id);

        // Cerere 1: DRAFT (pentru recepție)
        const [result1] = await connection.execute(
          `INSERT INTO analysis_requests 
           (request_number, patient_id, laboratory_id, status, reception_type, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, 1, NOW())`,
          [`CER-${new Date().getFullYear()}-000001`, patientId, labId, 'DRAFT', 'WITHOUT_RECEPTION']
        );

        for (const testId of testIds) {
          await connection.execute(
            'INSERT INTO analysis_request_tests (request_id, test_id, priority, status) VALUES (?, ?, ?, ?)',
            [result1.insertId, testId, 'NORMAL', 'PENDING']
          );
        }
        console.log(`   ✅ Cerere demo 1 creată (DRAFT - pentru recepție)`);

        // Cerere 2: RECEIVED (pentru lista de lucru)
        const [result2] = await connection.execute(
          `INSERT INTO analysis_requests 
           (request_number, patient_id, laboratory_id, status, reception_type, reception_date, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW())`,
          [`CER-${new Date().getFullYear()}-000002`, patientId, labId, 'RECEIVED', 'WITH_RECEPTION', 1]
        );

        for (const testId of testIds) {
          await connection.execute(
            'INSERT INTO analysis_request_tests (request_id, test_id, priority, status) VALUES (?, ?, ?, ?)',
            [result2.insertId, testId, 'NORMAL', 'IN_PROGRESS']
          );
        }
        console.log(`   ✅ Cerere demo 2 creată (RECEIVED - pentru lista de lucru)`);
      }
    } else {
      console.log(`   ✅ Există deja ${requests[0].count} cereri de analize`);
    }

    console.log('\n✅ Seed completat cu succes!');
    console.log('\n📊 Rezumat:');
    const [finalPatients] = await connection.execute('SELECT COUNT(*) as count FROM patients');
    const [finalLabs] = await connection.execute('SELECT COUNT(*) as count FROM laboratories');
    const [finalTests] = await connection.execute('SELECT COUNT(*) as count FROM laboratory_tests');
    const [finalRequests] = await connection.execute('SELECT COUNT(*) as count FROM analysis_requests');
    
    console.log(`   - Pacienți: ${finalPatients[0].count}`);
    console.log(`   - Laboratoare: ${finalLabs[0].count}`);
    console.log(`   - Teste: ${finalTests[0].count}`);
    console.log(`   - Cereri de analize: ${finalRequests[0].count}`);

  } catch (error) {
    console.error('❌ Eroare:', error.message);
  } finally {
    await connection.end();
  }
}

seedDemoData().catch(console.error);
