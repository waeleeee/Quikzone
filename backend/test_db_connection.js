const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if shippers table exists
    const shippersCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'shippers'
      );
    `);
    console.log('📋 Shippers table exists:', shippersCheck.rows[0].exists);
    
    // Check if parcels table exists
    const parcelsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'parcels'
      );
    `);
    console.log('📦 Parcels table exists:', parcelsCheck.rows[0].exists);
    
    // Check if complaints table exists
    const complaintsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'complaints'
      );
    `);
    console.log('⚠️ Complaints table exists:', complaintsCheck.rows[0].exists);
    
    // Check shippers structure
    const shippersStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'shippers'
      ORDER BY ordinal_position;
    `);
    console.log('📋 Shippers table structure:');
    shippersStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check parcels structure
    const parcelsStructure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'parcels'
      ORDER BY ordinal_position;
    `);
    console.log('📦 Parcels table structure:');
    parcelsStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Check if Ritej exists
    const ritejCheck = await client.query(`
      SELECT id, name, email FROM shippers WHERE email = $1
    `, ['ritejchaieb@icloud.com']);
    
    if (ritejCheck.rows.length > 0) {
      console.log('✅ Ritej found:', ritejCheck.rows[0]);
    } else {
      console.log('❌ Ritej not found');
      
      // List all shippers
      const allShippers = await client.query(`
        SELECT id, name, email FROM shippers LIMIT 5
      `);
      console.log('📋 Available shippers:');
      allShippers.rows.forEach(row => {
        console.log(`  - ${row.name} (${row.email})`);
      });
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await pool.end();
  }
}

testDatabase(); 