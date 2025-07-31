const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waelrh',
});

async function checkTableSchema() {
  try {
    console.log('🔍 Checking agency_members table schema...\n');
    
    // Get table columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'agency_members'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 AGENCY_MEMBERS TABLE COLUMNS:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    
    // Get sample data to see what's actually there
    console.log('\n📋 SAMPLE DATA:');
    const sampleData = await pool.query('SELECT * FROM agency_members LIMIT 1');
    if (sampleData.rows.length > 0) {
      console.log('Sample record:', sampleData.rows[0]);
    } else {
      console.log('No data found in agency_members table');
    }
    
  } catch (error) {
    console.error('❌ Error checking table schema:', error);
  } finally {
    await pool.end();
  }
}

checkTableSchema(); 