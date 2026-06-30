import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

config();

async function seedDatabase() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'DSPD',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('🌱 Starting database seeding...');

    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'seed_departments.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sqlContent
      .split(';')
      .filter(statement => statement.trim().length > 0);

    // Execute each statement
    for (const statement of statements) {
      await pool.execute(statement);
    }

    console.log('✅ Database seeding completed successfully!');

    // Verify the results
    const [departments] = await pool.execute('SELECT * FROM departments');
    console.log('📊 Departments:', departments);

    const [departmentUsers] = await pool.execute('SELECT * FROM department_users');
    console.log('👥 Department Users:', departmentUsers);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seedDatabase(); 