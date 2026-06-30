/**
 * Script pentru crearea tabelelor de interoperabilitate
 * Rulează: node backend/src/scripts/setup_interoperability.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function setupInteroperability() {
  let connection;
  
  try {
    // Conectare la baza de date
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'spital_brasov',
      multipleStatements: true
    });

    console.log('✅ Conectat la baza de date');

    // Citește fișierul SQL
    const sqlPath = path.join(__dirname, '../db/migrations/add_interoperability.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Citit fișierul SQL:', sqlPath);

    // Rulează scriptul SQL
    await connection.query(sql);

    console.log('✅ Tabelele de interoperabilitate au fost create cu succes!');

    // Verifică dacă datele seed au fost inserate
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM external_integrations');
    console.log(`📊 Integrări externe în baza de date: ${rows[0].count}`);

    if (rows[0].count === 0) {
      console.log('⚠️  Nu există date seed. Rulează din nou scriptul SQL pentru a insera datele demo.');
    }

  } catch (error) {
    console.error('❌ Eroare la crearea tabelelor:', error.message);
    if (error.sql) {
      console.error('SQL Error:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexiunea la baza de date a fost închisă');
    }
  }
}

// Rulează scriptul
setupInteroperability()
  .then(() => {
    console.log('✅ Script finalizat cu succes!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Eroare:', error);
    process.exit(1);
  });

