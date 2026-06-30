import { compare } from 'bcrypt';

const storedHash = '$2a$10$xLurmvOZRTFXRz4KkYoYj.LgWn.PZx4UaPh/Xw2FyNmZsutl.5IXi';
const passwords = ['admin123', 'admin', 'password123', 'Admin123', 'Admin123!'];

async function checkPasswords() {
  console.log('Checking possible passwords...');
  
  for (const password of passwords) {
    const isMatch = await compare(password, storedHash);
    console.log(`Password "${password}": ${isMatch ? 'MATCH!' : 'no match'}`);
  }
}

checkPasswords().catch(console.error); 