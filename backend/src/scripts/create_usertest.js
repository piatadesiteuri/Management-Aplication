const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

async function createUserTest() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
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
      'SELECT id FROM users WHERE email = ? OR username = ?',
      ['usertest@spitalbrasov.ro', 'usertest']
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
    console.log('📝 Creare utilizator usertest...');
    
    // Hash parolă: usertest123!
    // Folosim bcrypt pentru a genera hash-ul
    const bcrypt = require('bcrypt');
    const password = 'usertest123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('🔐 Parola hash-uită generată');

    // Inserează utilizatorul
    const [result] = await connection.execute(
      `INSERT INTO users (
        email, 
        password, 
        first_name, 
        last_name, 
        username,
        is_active, 
        is_email_verified,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        'usertest@spitalbrasov.ro',
        hashedPassword,
        'User',
        'Test',
        'usertest',
        true,  // Activ direct
        true   // Email verificat direct
      ]
    );

    const userId = result.insertId;
    console.log(`✅ Utilizator creat cu ID: ${userId}`);

    // Asociază rolul WAREHOUSE_KEEPER
    await connection.execute(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [userId, roleId]
    );
    console.log('✅ Rolul WAREHOUSE_KEEPER a fost asociat utilizatorului!');

    // Verificare finală
    const [finalCheck] = await connection.execute(
      `SELECT u.id, u.email, u.username, u.first_name, u.last_name, 
              GROUP_CONCAT(r.name) as roles 
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       LEFT JOIN roles r ON ur.role_id = r.id 
       WHERE u.id = ?
       GROUP BY u.id`,
      [userId]
    );

    console.log('\n📋 Detalii utilizator creat:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID: ${finalCheck[0].id}`);
    console.log(`Email: ${finalCheck[0].email}`);
    console.log(`Username: ${finalCheck[0].username}`);
    console.log(`Nume: ${finalCheck[0].first_name} ${finalCheck[0].last_name}`);
    console.log(`Roluri: ${finalCheck[0].roles}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Cont de magazioner creat cu succes!');
    console.log('📧 Email: usertest@spitalbrasov.ro');
    console.log('👤 Username: usertest');
    console.log('🔑 Parolă: usertest123!');
    console.log('🏷️  Rol: WAREHOUSE_KEEPER (Magazioner)');

  } catch (error) {
    console.error('❌ Eroare:', error.message);
    if (error.code === 'ER_DUP_ENTRY') {
      console.error('⚠️  Utilizatorul cu acest email sau username există deja!');
    }
  } finally {
    await connection.end();
  }
}

createUserTest().catch(console.error);
