const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'quickzone_db',
  user: 'postgres',
  password: 'waelrh'
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result.rows[0].now);
    
    // Try to get users table info
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    console.log('Users count:', usersResult.rows[0].count);
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection(); 