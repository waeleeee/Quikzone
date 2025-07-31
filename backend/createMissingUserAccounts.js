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

const createMissingUserAccounts = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating missing user accounts for commercials...');
    
    // Find commercials without user accounts
    const commercialsWithoutUsers = await client.query(`
      SELECT c.id, c.name, c.email, c.phone, c.password
      FROM commercials c
      LEFT JOIN users u ON c.email = u.email
      WHERE u.id IS NULL
    `);
    
    if (commercialsWithoutUsers.rows.length === 0) {
      console.log('✅ All commercials already have user accounts');
      return;
    }
    
    console.log(`📝 Found ${commercialsWithoutUsers.rows.length} commercials without user accounts`);
    
    // Get Commercial role ID
    const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Commercial']);
    if (roleResult.rows.length === 0) {
      throw new Error('Commercial role not found');
    }
    const roleId = roleResult.rows[0].id;
    
    for (const commercial of commercialsWithoutUsers.rows) {
      console.log(`🔧 Creating user account for ${commercial.name} (${commercial.email})`);
      
      try {
        // Start transaction
        await client.query('BEGIN');
        
        // Create username from email
        const username = commercial.email.split('@')[0];
        const firstName = commercial.name.split(' ')[0] || commercial.name;
        const lastName = commercial.name.split(' ').slice(1).join(' ') || '';
        
        // Use existing password or default
        let hashedPassword = commercial.password;
        if (!hashedPassword) {
          const defaultPassword = 'wael123';
          hashedPassword = await bcrypt.hash(defaultPassword, 10);
        }
        
        // Create user account
        const userResult = await client.query(`
          INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_active, email_verified)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [username, commercial.email, hashedPassword, firstName, lastName, commercial.phone, true, true]);
        
        const userId = userResult.rows[0].id;
        
        // Assign Commercial role to user
        await client.query(`
          INSERT INTO user_roles (user_id, role_id, assigned_by)
          VALUES ($1, $2, $3)
        `, [userId, roleId, userId]);
        
        await client.query('COMMIT');
        console.log(`  ✅ Created user account for ${commercial.email}`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`  ❌ Error creating user account for ${commercial.email}:`, error.message);
      }
    }
    
    console.log('✅ All missing user accounts have been created');
    console.log('📝 Commercials can now log in with their email and password: wael123');
    
  } catch (error) {
    console.error('❌ Error creating missing user accounts:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
};

createMissingUserAccounts()
  .then(() => {
    console.log('✅ User account creation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ User account creation failed:', error);
    process.exit(1);
  }); 