const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waelrh',
});

async function checkParcelsSchema() {
  try {
    console.log('🔍 Checking parcels table schema...\n');
    
    // Get table columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'parcels'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 PARCELS TABLE COLUMNS:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    
    // Get sample data to see what's actually there
    console.log('\n📋 SAMPLE PARCEL DATA:');
    const sampleData = await pool.query('SELECT * FROM parcels LIMIT 1');
    if (sampleData.rows.length > 0) {
      console.log('Sample parcel record:', JSON.stringify(sampleData.rows[0], null, 2));
    } else {
      console.log('No data found in parcels table');
    }
    
    // Check shippers table too
    console.log('\n🔍 Checking shippers table schema...\n');
    
    const shipperColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'shippers'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 SHIPPERS TABLE COLUMNS:');
    shipperColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    
    // Get sample shipper data
    console.log('\n📋 SAMPLE SHIPPER DATA:');
    const sampleShipperData = await pool.query('SELECT * FROM shippers LIMIT 1');
    if (sampleShipperData.rows.length > 0) {
      console.log('Sample shipper record:', JSON.stringify(sampleShipperData.rows[0], null, 2));
    } else {
      console.log('No data found in shippers table');
    }
    
  } catch (error) {
    console.error('❌ Error checking table schema:', error);
  } finally {
    await pool.end();
  }
}

checkParcelsSchema(); 