const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function cleanupTestData() {
  try {
    console.log('🧹 Cleaning up test data...\n');

    // Delete test parcels
    const deleteResult = await pool.query(`
      DELETE FROM parcels 
      WHERE tracking_number LIKE 'TEST-%'
    `);
    
    console.log(`✅ Deleted ${deleteResult.rowCount} test parcels`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await pool.end();
  }
}

cleanupTestData(); 