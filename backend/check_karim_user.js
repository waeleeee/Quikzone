const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'quickzone_db',
  user: 'postgres',
  password: 'waelrh'
});

async function checkKarimUser() {
  try {
    console.log('🔍 Checking Karim user data...');
    
    const result = await pool.query(`
      SELECT id, first_name, last_name, email, role, agency, governorate 
      FROM users 
      WHERE email = 'karim.benali@quickzone.tn'
    `);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\n👤 Karim user data:');
      console.log(`- ID: ${user.id}`);
      console.log(`- Name: ${user.first_name} ${user.last_name}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Role: ${user.role}`);
      console.log(`- Agency: ${user.agency || 'NULL'}`);
      console.log(`- Governorate: ${user.governorate || 'NULL'}`);
    } else {
      console.log('❌ Karim user not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkKarimUser(); 