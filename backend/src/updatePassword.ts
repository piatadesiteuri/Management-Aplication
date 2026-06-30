import { hash } from 'bcrypt';
import { config as dotenvConfig } from 'dotenv';
import pool from './config/database';

async function updatePassword() {
  dotenvConfig();
  const password = 'admin123';
  const saltRounds = 10;
  
  console.log('Generating hash for password:', password);
  const hashedPassword = await hash(password, saltRounds);
  console.log('Generated hash:', hashedPassword);

  try {
    console.log('Updating password in database...');
    await pool.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@dspdolj.ro']
    );
    console.log('Password updated successfully!');
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await pool.end();
  }
}

updatePassword().catch(console.error); 