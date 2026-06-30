const mysql = require('mysql2/promise');

async function testDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DSPD'
    });
    
    console.log('✅ Connected to database');
    
    // Test calendar_events table
    const [events] = await connection.execute(`
      SELECT 
        ce.*,
        JSON_OBJECT(
          'id', u.id,
          'email', u.email,
          'firstName', u.first_name,
          'lastName', u.last_name
        ) as user,
        JSON_OBJECT(
          'id', d.id,
          'name', d.name,
          'description', d.description
        ) as department,
        JSON_OBJECT(
          'id', v.id,
          'brand', v.brand,
          'model', v.model,
          'registration_number', v.registration_number,
          'status', v.status
        ) as vehicle,
        (
          SELECT COUNT(*) 
          FROM event_assignments ea 
          WHERE ea.event_id = ce.id
        ) as assignments_count
      FROM calendar_events ce
      LEFT JOIN users u ON ce.user_id = u.id
      LEFT JOIN departments d ON ce.department_id = d.id
      LEFT JOIN vehicles v ON ce.vehicle_id = v.id
      LIMIT 1
    `);
    
    console.log('📅 Sample event:', JSON.stringify(events[0], null, 2));
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

testDatabase(); 