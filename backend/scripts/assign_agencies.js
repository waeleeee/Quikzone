const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'quickzone_db',
  user: 'postgres',
  password: 'waelrh'
});

async function assignAgencies() {
  const client = await pool.connect();
  
  try {
    console.log('🏢 Assigning agencies to users...');
    
    await client.query('BEGIN');
    
    // Assign agencies based on email patterns and roles
    console.log('🔄 Updating user agencies...');
    
    // Admin users - Agence Tunis
    await client.query(`
      UPDATE users 
      SET agency = 'Agence Tunis' 
      WHERE role = 'Admin' 
      AND (email LIKE '%wael%' OR email LIKE '%admin%' OR email LIKE '%tunis%')
    `);
    
    // Chef d'agence users - Agence Sousse
    await client.query(`
      UPDATE users 
      SET agency = 'Agence Sousse' 
      WHERE role = 'Chef d''agence' 
      AND (email LIKE '%karim%' OR email LIKE '%sousse%')
    `);
    
    // Chef d'agence users - Agence Tunis
    await client.query(`
      UPDATE users 
      SET agency = 'Agence Tunis' 
      WHERE role = 'Chef d''agence' 
      AND (email LIKE '%tunis%' OR email LIKE '%wael%')
    `);
    
    // Membre d'agence users - Agence Sousse
    await client.query(`
      UPDATE users 
      SET agency = 'Agence Sousse' 
      WHERE role = 'Membre de l''agence' 
      AND (email LIKE '%sousse%')
    `);
    
    // Membre d'agence users - Agence Tunis
    await client.query(`
      UPDATE users 
      SET agency = 'Agence Tunis' 
      WHERE role = 'Membre de l''agence' 
      AND (email LIKE '%tunis%')
    `);
    
    // Assign governorates for users without agencies
    await client.query(`
      UPDATE users 
      SET governorate = 'Sousse' 
      WHERE agency = 'Agence Sousse'
    `);
    
    await client.query(`
      UPDATE users 
      SET governorate = 'Tunis' 
      WHERE agency = 'Agence Tunis'
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ Agency assignment completed!');
    
    // Verify the changes
    console.log('\n🔍 Verifying agency assignments...');
    const result = await client.query(`
      SELECT id, first_name, last_name, email, role, agency, governorate 
      FROM users 
      WHERE agency IS NOT NULL
      ORDER BY role, agency
      LIMIT 10
    `);
    
    console.log('\n📋 Users with agencies:');
    result.rows.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`- Name: ${user.first_name} ${user.last_name}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Role: ${user.role}`);
      console.log(`- Agency: ${user.agency}`);
      console.log(`- Governorate: ${user.governorate}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Agency assignment failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

assignAgencies(); 