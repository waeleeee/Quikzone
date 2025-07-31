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

const addPasswordToCommercials = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding password column to commercials table...');
    
    // Check if password column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'commercials' AND column_name = 'password'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Password column already exists in commercials table');
      return;
    }
    
    // Add password column
    await client.query(`
      ALTER TABLE commercials 
      ADD COLUMN password VARCHAR(255)
    `);
    
    console.log('✅ Password column added to commercials table successfully');
    
    // Set default passwords for existing commercials
    const bcrypt = require('bcryptjs');
    const defaultPassword = 'wael123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    await client.query(`
      UPDATE commercials 
      SET password = $1 
      WHERE password IS NULL
    `, [hashedPassword]);
    
    console.log('✅ Default passwords set for existing commercials');
    console.log('📝 Default password for existing commercials: wael123');
    
  } catch (error) {
    console.error('❌ Error adding password column to commercials:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the migration
addPasswordToCommercials()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 