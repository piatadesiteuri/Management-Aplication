const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function checkPassword() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'spital_brasov',
    port: Number(process.env.DB_PORT || 3306),
  });

  try {
    // Găsește utilizatorul
    const [users] = await connection.execute(
      'SELECT id, email, password FROM users WHERE email = ?',
      ['usertest@spitalbrasov.ro']
    );

    if (users.length === 0) {
      console.log('❌ Utilizatorul nu există!');
      await connection.end();
      return;
    }

    const user = users[0];
    console.log('📋 Utilizator găsit:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Hash parolă: ${user.password.substring(0, 20)}...`);

    // Testează parola
    const testPassword = 'usertest123!';
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    console.log(`\n🔐 Testare parolă: "${testPassword}"`);
    console.log(`   Rezultat: ${isValid ? '✅ CORECTĂ' : '❌ INCORECTĂ'}`);

    if (!isValid) {
      console.log('\n⚠️  Parola nu corespunde! Regenerăm hash-ul...');
      
      // Generează un nou hash pentru parola corectă
      const newHash = await bcrypt.hash(testPassword, 10);
      
      // Actualizează parola în baza de date
      await connection.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [newHash, user.id]
      );
      
      console.log('✅ Parola a fost actualizată!');
      
      // Verifică din nou
      const [updatedUsers] = await connection.execute(
        'SELECT password FROM users WHERE id = ?',
        [user.id]
      );
      
      const isValidAfter = await bcrypt.compare(testPassword, updatedUsers[0].password);
      console.log(`\n🔐 Verificare finală: ${isValidAfter ? '✅ SUCCES' : '❌ EȘEC'}`);
    }

  } catch (error) {
    console.error('❌ Eroare:', error.message);
  } finally {
    await connection.end();
  }
}

checkPassword().catch(console.error);
