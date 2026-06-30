const mysql = require('mysql2/promise');
require('dotenv').config();

async function createWarehouseKeeper() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'spital_brasov',
    port: Number(process.env.DB_PORT || 3306),
  });

  try {
    console.log('🔍 Verificare rol WAREHOUSE_KEEPER...');
    
    // Verifică dacă rolul există
    const [roles] = await connection.execute(
      'SELECT id FROM roles WHERE name = ?',
      ['WAREHOUSE_KEEPER']
    );

    if (roles.length === 0) {
      console.log('❌ Rolul WAREHOUSE_KEEPER nu există! Te rog să-l creezi mai întâi.');
      await connection.end();
      return;
    }

    const roleId = roles[0].id;
    console.log(`✅ Rolul WAREHOUSE_KEEPER există (ID: ${roleId})`);

    // Verifică dacă utilizatorul există deja
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      ['magazioner@spitalbrasov.ro']
    );

    if (existingUsers.length > 0) {
      const userId = existingUsers[0].id;
      console.log(`⚠️  Utilizatorul există deja (ID: ${userId}). Verificare rol...`);

      // Verifică dacă are deja rolul
      const [userRoles] = await connection.execute(
        'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?',
        [userId, roleId]
      );

      if (userRoles.length > 0) {
        console.log('✅ Utilizatorul are deja rolul WAREHOUSE_KEEPER!');
        await connection.end();
        return;
      } else {
        // Adaugă rolul
        await connection.execute(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, roleId]
        );
        console.log('✅ Rolul WAREHOUSE_KEEPER a fost adăugat utilizatorului existent!');
        await connection.end();
        return;
      }
    }

    // Creează utilizatorul nou
    console.log('📝 Creare utilizator magazioner...');
    
    // Hash parolă: Magazioner123!
    const hashedPassword = '$2b$10$zek8Qc8OZejrY/pLfb1iUenO53adBIz5mP2lFAXGzQVrwT9QkssS2';

    const [result] = await connection.execute(
      `INSERT INTO users (email, password, first_name, last_name, is_active, is_email_verified, created_at)
       VALUES (?, ?, ?, ?, 1, 1, NOW())`,
      ['magazioner@spitalbrasov.ro', hashedPassword, 'Magazioner', 'Spital Brasov']
    );

    const userId = result.insertId;
    console.log(`✅ Utilizator creat cu ID: ${userId}`);

    // Asociază rolul
    await connection.execute(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userId, roleId]
    );

    console.log('✅ Rolul WAREHOUSE_KEEPER a fost asociat utilizatorului!');

    // Afișează detaliile
    const [user] = await connection.execute(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.is_active, GROUP_CONCAT(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [userId]
    );

    console.log('\n📋 Detalii utilizator creat:');
    console.log(JSON.stringify(user[0], null, 2));
    console.log('\n✅ Cont de magazioner creat cu succes!');
    console.log('📧 Email: magazioner@spitalbrasov.ro');
    console.log('🔑 Parolă: Magazioner123!');

    await connection.end();
  } catch (error) {
    console.error('❌ Eroare:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠️  Utilizatorul există deja cu acest email.');
    }
    await connection.end();
    process.exit(1);
  }
}

createWarehouseKeeper();

