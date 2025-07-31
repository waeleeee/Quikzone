const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waelrh',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: false
});

const checkCommercialsTable = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking commercials table structure...');
    
    // Check table columns
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'commercials' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Commercials table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if password column exists
    const passwordColumn = columnsResult.rows.find(col => col.column_name === 'password');
    if (passwordColumn) {
      console.log('\n✅ Password column exists in commercials table');
    } else {
      console.log('\n❌ Password column is missing from commercials table');
    }
    
    // Check sample data
    const sampleData = await client.query(`
      SELECT id, name, email, phone, governorate, address, title, 
             CASE WHEN password IS NOT NULL THEN 'Has password' ELSE 'No password' END as password_status
      FROM commercials 
      LIMIT 5
    `);
    
    console.log('\n📊 Sample commercials data:');
    sampleData.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Name: ${row.name}, Email: ${row.email}, Password: ${row.password_status}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking commercials table:', error);
  } finally {
    client.release();
    pool.end();
  }
};

checkCommercialsTable(); 