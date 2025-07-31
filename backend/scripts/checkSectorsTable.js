const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waelrh',
});

async function checkSectorsTable() {
  try {
    console.log('🔍 Checking sectors table schema...\n');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sectors'
      ORDER BY ordinal_position
    `);
    console.log('📋 SECTORS TABLE COLUMNS:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    const sample = await pool.query('SELECT * FROM sectors LIMIT 1');
    if (sample.rows.length > 0) {
      console.log('\nSample row:', sample.rows[0]);
    } else {
      console.log('\nNo data in sectors table.');
    }
  } catch (error) {
    console.error('❌ Error checking sectors table:', error);
  } finally {
    await pool.end();
  }
}

checkSectorsTable(); 