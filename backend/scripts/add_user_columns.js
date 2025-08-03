const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'quickzone_db',
  user: 'postgres',
  password: 'waelrh'
});

async function addUserColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding missing columns to users table...');
    
    await client.query('BEGIN');
    
    // Add role column
    console.log('➕ Adding role column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Utilisateur'
    `);
    
    // Add agency column
    console.log('➕ Adding agency column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS agency VARCHAR(100)
    `);
    
    // Add governorate column
    console.log('➕ Adding governorate column...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS governorate VARCHAR(100)
    `);
    
    // Update existing users with default roles based on email patterns
    console.log('🔄 Updating existing users with roles...');
    
    // Admin users
    await client.query(`
      UPDATE users 
      SET role = 'Admin' 
      WHERE email LIKE '%admin%' OR email LIKE '%wael%'
    `);
    
         // Chef d'agence users
     await client.query(`
       UPDATE users 
       SET role = 'Chef d''agence' 
       WHERE email LIKE '%chef%' OR email LIKE '%karim%'
     `);
     
     // Membre d'agence users
     await client.query(`
       UPDATE users 
       SET role = 'Membre de l''agence' 
       WHERE email LIKE '%membre%' OR email LIKE '%agent%'
     `);
    
    // Livreur users
    await client.query(`
      UPDATE users 
      SET role = 'Livreur' 
      WHERE email LIKE '%livreur%' OR email LIKE '%driver%'
    `);
    
    // Expéditeur users (default for others)
    await client.query(`
      UPDATE users 
      SET role = 'Expéditeur' 
      WHERE role = 'Utilisateur' OR role IS NULL
    `);
    
         // Add some sample agency data
     console.log('🏢 Adding sample agency data...');
     await client.query(`
       UPDATE users 
       SET agency = 'Agence Sousse' 
       WHERE role IN ('Chef d''agence', 'Membre de l''agence') 
       AND (email LIKE '%sousse%' OR email LIKE '%karim%')
     `);
     
     await client.query(`
       UPDATE users 
       SET agency = 'Agence Tunis' 
       WHERE role IN ('Chef d''agence', 'Membre de l''agence') 
       AND (email LIKE '%tunis%' OR email LIKE '%wael%')
     `);
    
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    const result = await client.query(`
      SELECT id, first_name, last_name, email, role, agency, governorate 
      FROM users 
      LIMIT 5
    `);
    
    console.log('\n📋 Sample users after migration:');
    result.rows.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`- ID: ${user.id}`);
      console.log(`- Name: ${user.first_name} ${user.last_name}`);
      console.log(`- Email: ${user.email}`);
      console.log(`- Role: ${user.role}`);
      console.log(`- Agency: ${user.agency || 'NULL'}`);
      console.log(`- Governorate: ${user.governorate || 'NULL'}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

addUserColumns(); 