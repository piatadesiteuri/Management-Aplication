const mysql = require('mysql2/promise');

async function checkUserRoles() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dspd'
  });
  
  try {
    console.log('=== Checking magazioner user ===');
    
    // Verific utilizatorul magazioner
    const [users] = await connection.execute(`
      SELECT u.id, u.first_name, u.last_name, u.email, GROUP_CONCAT(r.name) as roles 
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      LEFT JOIN roles r ON ur.role_id = r.id 
      WHERE u.email = 'magazioner@dspd.ro'
      GROUP BY u.id
    `);
    
    console.log('Magazioner user:', users[0]);
    
    if (!users[0] || !users[0].roles) {
      console.log('No roles found. Adding WAREHOUSE_KEEPER role...');
      
      // Găsesc ID-ul pentru WAREHOUSE_KEEPER
      const [roleId] = await connection.execute(
        'SELECT id FROM roles WHERE name = ?',
        ['WAREHOUSE_KEEPER']
      );
      
      console.log('WAREHOUSE_KEEPER role ID:', roleId[0]?.id);
      
      if (roleId.length > 0 && users[0]) {
        await connection.execute(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [users[0].id, roleId[0].id]
        );
        console.log('Added WAREHOUSE_KEEPER role to user');
        
        // Verific din nou
        const [updatedUsers] = await connection.execute(`
          SELECT u.id, u.first_name, u.last_name, u.email, GROUP_CONCAT(r.name) as roles 
          FROM users u 
          LEFT JOIN user_roles ur ON u.id = ur.user_id 
          LEFT JOIN roles r ON ur.role_id = r.id 
          WHERE u.email = 'magazioner@dspd.ro'
          GROUP BY u.id
        `);
        
        console.log('Updated user:', updatedUsers[0]);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await connection.end();
}

checkUserRoles().catch(console.error);
