const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function checkTables() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking database tables...');
    
    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check if drivers table exists
    const driversTableExists = tablesResult.rows.some(row => row.table_name === 'drivers');
    console.log('\n📋 drivers table exists:', driversTableExists);
    
    if (driversTableExists) {
      // Get drivers table structure
      const driversColumnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'drivers'
        ORDER BY ordinal_position
      `);
      
      console.log('📋 drivers table columns:');
      driversColumnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
      });
      
      // Get sample drivers data
      const driversSampleResult = await client.query(`
        SELECT * FROM drivers LIMIT 3
      `);
      
      console.log('\n📊 Sample drivers data:');
      driversSampleResult.rows.forEach((row, index) => {
        console.log(`  Driver ${index + 1}:`, row);
      });
    }
    
    // Check users table structure again
    const usersColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 users table columns:');
    usersColumnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Get sample users data
    const usersSampleResult = await client.query(`
      SELECT id, username, email, first_name, last_name, phone, is_active FROM users LIMIT 3
    `);
    
    console.log('\n📊 Sample users data:');
    usersSampleResult.rows.forEach((row, index) => {
      console.log(`  User ${index + 1}:`, row);
    });
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await checkTables();
    console.log('🎉 Tables check completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Check failed:', error);
    process.exit(1);
  }
}

main(); 