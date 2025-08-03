const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'quickzone_db',
  user: 'postgres',
  password: 'waelrh'
});

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table structure...');
    
    // Check table columns
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Users table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    // Check if agency/governorate columns exist
    const hasAgency = columnsResult.rows.some(row => row.column_name === 'agency');
    const hasGovernorate = columnsResult.rows.some(row => row.column_name === 'governorate');
    
    console.log(`\n🔍 Agency column exists: ${hasAgency}`);
    console.log(`🔍 Governorate column exists: ${hasGovernorate}`);
    
    // Check sample user data
    const userResult = await pool.query('SELECT id, name, email, role, agency, governorate FROM users LIMIT 3');
    
    console.log('\n👥 Sample user data:');
    userResult.rows.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`- ID: ${user.id}`);
      console.log(`- Name: ${user.name}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Role: ${user.role}`);
      console.log(`- Agency: ${user.agency || 'NULL'}`);
      console.log(`- Governorate: ${user.governorate || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersTable(); 