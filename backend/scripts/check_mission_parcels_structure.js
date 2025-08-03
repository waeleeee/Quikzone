const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function checkMissionParcelsTable() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking mission_parcels table structure...');
    
    // Check if table exists
    const tableExistsResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'mission_parcels'
      );
    `);
    
    console.log('📋 mission_parcels table exists:', tableExistsResult.rows[0].exists);
    
    if (tableExistsResult.rows[0].exists) {
      // Get column information
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'mission_parcels'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 mission_parcels table columns:');
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
      });
      
      // Get sample data
      const sampleResult = await client.query(`
        SELECT * FROM mission_parcels LIMIT 5
      `);
      
      console.log('\n📊 Sample mission_parcels data:');
      sampleResult.rows.forEach((row, index) => {
        console.log(`  Row ${index + 1}:`, row);
      });
      
      // Check if there are any missions with parcels
      const missionsWithParcelsResult = await client.query(`
        SELECT 
          pm.id as mission_id,
          pm.mission_number,
          COUNT(mp.parcel_id) as parcel_count
        FROM pickup_missions pm
        LEFT JOIN mission_parcels mp ON pm.id = mp.mission_id
        GROUP BY pm.id, pm.mission_number
        ORDER BY pm.created_at DESC
        LIMIT 5
      `);
      
      console.log('\n📊 Recent missions with parcel counts:');
      missionsWithParcelsResult.rows.forEach(row => {
        console.log(`  Mission ${row.mission_number}: ${row.parcel_count} parcels`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking mission_parcels table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await checkMissionParcelsTable();
    console.log('🎉 Mission parcels table check completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Check failed:', error);
    process.exit(1);
  }
}

main(); 