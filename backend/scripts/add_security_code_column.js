const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function addSecurityCodeColumn() {
  const client = await pool.connect();
  try {
    console.log('🔧 Adding security_code column to pickup_missions table...');
    
    // Check if column already exists
    const checkColumnResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pickup_missions' AND column_name = 'security_code'
    `);
    
    if (checkColumnResult.rows.length === 0) {
      // Add security_code column
      await client.query(`
        ALTER TABLE pickup_missions 
        ADD COLUMN security_code VARCHAR(10) UNIQUE
      `);
      console.log('✅ security_code column added successfully!');
    } else {
      console.log('ℹ️ security_code column already exists');
    }
    
  } catch (error) {
    console.error('❌ Error adding security_code column:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await addSecurityCodeColumn();
    console.log('🎉 Security code column setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
}

main(); 