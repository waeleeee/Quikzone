const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waelrh',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: false
});

const testPasswordUpdate = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing password update functionality...');
    
    // Check current state
    const currentState = await client.query(`
      SELECT c.id, c.name, c.email, c.password as commercial_password,
             u.password_hash as user_password_hash
      FROM commercials c
      LEFT JOIN users u ON c.email = u.email
      ORDER BY c.id
    `);
    
    console.log('\n📊 Current password state:');
    currentState.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Name: ${row.name}, Email: ${row.email}`);
      console.log(`  Commercial password: ${row.commercial_password ? 'Set' : 'Not set'}`);
      console.log(`  User password: ${row.user_password_hash ? 'Set' : 'Not set'}`);
    });
    
    // Test updating a password
    const testCommercialId = currentState.rows[0]?.id;
    if (testCommercialId) {
      console.log(`\n🧪 Testing password update for commercial ID: ${testCommercialId}`);
      
      const newPassword = 'test123';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update commercial password
      await client.query(`
        UPDATE commercials 
        SET password = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [hashedPassword, testCommercialId]);
      
      // Get commercial email
      const commercialResult = await client.query(`
        SELECT email FROM commercials WHERE id = $1
      `, [testCommercialId]);
      
      if (commercialResult.rows.length > 0) {
        const email = commercialResult.rows[0].email;
        
        // Update user password
        await client.query(`
          UPDATE users 
          SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
          WHERE email = $2
        `, [hashedPassword, email]);
        
        console.log(`✅ Updated password for ${email} to: ${newPassword}`);
      }
    }
    
    // Check final state
    const finalState = await client.query(`
      SELECT c.id, c.name, c.email, c.password as commercial_password,
             u.password_hash as user_password_hash
      FROM commercials c
      LEFT JOIN users u ON c.email = u.email
      WHERE c.id = $1
    `, [testCommercialId]);
    
    if (finalState.rows.length > 0) {
      const row = finalState.rows[0];
      console.log(`\n📊 Final state for ${row.name}:`);
      console.log(`  Commercial password: ${row.commercial_password ? 'Set' : 'Not set'}`);
      console.log(`  User password: ${row.user_password_hash ? 'Set' : 'Not set'}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing password update:', error);
  } finally {
    client.release();
    pool.end();
  }
};

testPasswordUpdate()
  .then(() => {
    console.log('✅ Password update test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Password update test failed:', error);
    process.exit(1);
  }); 