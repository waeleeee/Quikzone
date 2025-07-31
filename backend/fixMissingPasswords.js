const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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

const fixMissingPasswords = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing missing passwords for commercials...');
    
    // Find commercials without passwords
    const commercialsWithoutPassword = await client.query(`
      SELECT id, name, email 
      FROM commercials 
      WHERE password IS NULL
    `);
    
    if (commercialsWithoutPassword.rows.length === 0) {
      console.log('✅ All commercials already have passwords');
      return;
    }
    
    console.log(`📝 Found ${commercialsWithoutPassword.rows.length} commercials without passwords`);
    
    // Set default password for each commercial
    const defaultPassword = 'wael123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    for (const commercial of commercialsWithoutPassword.rows) {
      console.log(`🔧 Setting password for ${commercial.name} (${commercial.email})`);
      
      // Update commercial password
      await client.query(`
        UPDATE commercials 
        SET password = $1 
        WHERE id = $2
      `, [hashedPassword, commercial.id]);
      
      // Check if user exists and update their password too
      const userResult = await client.query(`
        SELECT id FROM users WHERE email = $1
      `, [commercial.email]);
      
      if (userResult.rows.length > 0) {
        await client.query(`
          UPDATE users 
          SET password_hash = $1 
          WHERE email = $2
        `, [hashedPassword, commercial.email]);
        console.log(`  ✅ Updated user password for ${commercial.email}`);
      } else {
        console.log(`  ⚠️  No user account found for ${commercial.email}`);
      }
    }
    
    console.log('✅ All missing passwords have been set');
    console.log('📝 Default password for all commercials: wael123');
    
  } catch (error) {
    console.error('❌ Error fixing missing passwords:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
};

fixMissingPasswords()
  .then(() => {
    console.log('✅ Password fix completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Password fix failed:', error);
    process.exit(1);
  }); 