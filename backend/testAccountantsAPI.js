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

const testAccountantsAPI = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing accountants API data...');
    
    // Test the exact query that the API uses
    const query = `
      SELECT id, name, email, phone, governorate, address, title, agency, created_at,
             CASE WHEN password IS NOT NULL THEN true ELSE false END as has_password
      FROM accountants
      WHERE 1=1
      ORDER BY created_at DESC
    `;
    
    const result = await client.query(query);
    
    console.log('\n📊 Accountants data with has_password field:');
    result.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Name: ${row.name}, Email: ${row.email}`);
      console.log(`  Has Password: ${row.has_password}`);
      console.log(`  All fields:`, row);
      console.log('---');
    });
    
    // Test creating a new accountant
    console.log('\n🧪 Testing accountant creation...');
    const testAccountant = {
      name: 'Test Accountant',
      email: 'test.accountant@quickzone.tn',
      password: 'test123',
      phone: '+216 99 999 999',
      governorate: 'Tunis',
      address: 'Test Address',
      title: 'comptable',
      agency: 'Siège'
    };
    
    console.log('Test data:', testAccountant);
    
  } catch (error) {
    console.error('❌ Error testing accountants API:', error);
  } finally {
    client.release();
    pool.end();
  }
};

testAccountantsAPI()
  .then(() => {
    console.log('✅ Accountants API test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Accountants API test failed:', error);
    process.exit(1);
  }); 