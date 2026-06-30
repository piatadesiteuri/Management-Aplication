const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function verifyUserTest() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'spital_brasov',
    port: Number(process.env.DB_PORT || 3306),
  });

  try {
    console.log('🔍 Verificare utilizator usertest...\n');
    
    const [users] = await connection.execute(
      `SELECT 
        u.id, 
        u.email, 
        u.username,
        u.first_name, 
        u.last_name, 
        u.is_active, 
        u.is_email_verified,
        GROUP_CONCAT(r.name) as roles,
        GROUP_CONCAT(r.id) as role_ids
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       LEFT JOIN roles r ON ur.role_id = r.id 
       WHERE u.email = ? OR u.username = ?
       GROUP BY u.id`,
      ['usertest@spitalbrasov.ro', 'usertest']
    );

    if (users.length === 0) {
      console.log('❌ Utilizatorul nu a fost găsit!');
      await connection.end();
      return;
    }

    const user = users[0];
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 DETALII UTILIZATOR:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Username: ${user.username}`);
    console.log(`Nume complet: ${user.first_name} ${user.last_name}`);
    console.log(`Status activ: ${user.is_active ? '✅ DA' : '❌ NU'}`);
    console.log(`Email verificat: ${user.is_email_verified ? '✅ DA' : '❌ NU'}`);
    console.log(`Roluri: ${user.roles || 'Niciun rol'}`);
    console.log(`ID-uri roluri: ${user.role_ids || 'N/A'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verificare specifică pentru rolul WAREHOUSE_KEEPER
    if (user.roles && user.roles.includes('WAREHOUSE_KEEPER')) {
      console.log('✅ Utilizatorul are rolul WAREHOUSE_KEEPER (Magazioner)');
    } else {
      console.log('⚠️  Utilizatorul NU are rolul WAREHOUSE_KEEPER!');
    }

    console.log('\n📝 Credențiale de autentificare:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Parolă: usertest123!`);

  } catch (error) {
    console.error('❌ Eroare:', error.message);
  } finally {
    await connection.end();
  }
}

verifyUserTest().catch(console.error);
