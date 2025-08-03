const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function checkUsersTable() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking users table structure...');
    
    // Get column information
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 users table columns:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Get sample data
    const sampleResult = await client.query(`
      SELECT id, first_name, last_name, email, role, agency, status
      FROM users 
      WHERE role = 'Livreurs' 
      LIMIT 3
    `);
    
    console.log('\n📊 Sample livreur data:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`  Livreur ${index + 1}:`, row);
    });
    
  } catch (error) {
    console.error('❌ Error checking users table:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await checkUsersTable();
    console.log('🎉 Users table check completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Check failed:', error);
    process.exit(1);
  }
}

main(); 