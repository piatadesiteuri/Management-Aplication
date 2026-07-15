/**
 * Rulează migrarea pentru modulul Buget & Execuție.
 * Usage: node backend/src/scripts/setup_budget.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  const sqlPaths = [
    path.join(__dirname, '../db/migrations/add_budget_execution.sql'),
    path.join(__dirname, '../db/migrations/alter_budget_indicators_meta.sql'),
    path.join(__dirname, '../db/migrations/add_budget_funding_source.sql'),
    path.join(__dirname, '../db/migrations/seed_budget_expense_cont_executie.sql'),
    path.join(__dirname, '../db/migrations/seed_budget_annual_indicators_complete.sql'),
  ];

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'spital_brasov',
    multipleStatements: true,
  });
  try {
    for (const sqlPath of sqlPaths) {
      if (!fs.existsSync(sqlPath)) {
        console.warn('⚠️ Missing SQL file, skipping:', sqlPath);
        continue;
      }
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log('📦 Running budget migration:', sqlPath);
      await conn.query(sql);
    }
    console.log('✅ Budget migrations applied successfully.');
  } catch (err) {
    console.error('❌ Budget migration failed:', err);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

run();


