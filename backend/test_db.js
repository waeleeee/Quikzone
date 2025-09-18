const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waelrh',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    console.log('Config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ? '***' : 'undefined'
    });

    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');

    // Test agency_managers table
    const result = await client.query('SELECT * FROM agency_managers');
    console.log('Agency managers count:', result.rows.length);
    console.log('Agency managers data:', result.rows);

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Database error:', error);
    await pool.end();
  }
}

testDatabase(); 