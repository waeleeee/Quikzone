const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function checkPickupMissionsStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking pickup_missions table structure...');
    
    // Get table structure
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pickup_missions'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 pickup_missions table columns:');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Check if table exists
    const tableExistsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pickup_missions'
      )
    `);
    
    console.log('\n📊 Table exists:', tableExistsResult.rows[0].exists);
    
    // Get sample data
    const sampleDataResult = await client.query(`
      SELECT * FROM pickup_missions LIMIT 1
    `);
    
    if (sampleDataResult.rows.length > 0) {
      console.log('\n📄 Sample data structure:');
      console.log(JSON.stringify(sampleDataResult.rows[0], null, 2));
    } else {
      console.log('\n📄 No data in table');
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await checkPickupMissionsStructure();
    process.exit(0);
  } catch (error) {
    console.error('💥 Check failed:', error);
    process.exit(1);
  }
}

main(); 