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

const createAccountantUserAccounts = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating missing user accounts for accountants...');
    
    // Find accountants without user accounts
    const accountantsWithoutUsers = await client.query(`
      SELECT a.id, a.name, a.email, a.phone, a.password
      FROM accountants a
      LEFT JOIN users u ON a.email = u.email
      WHERE u.id IS NULL
    `);
    
    if (accountantsWithoutUsers.rows.length === 0) {
      console.log('✅ All accountants already have user accounts');
      return;
    }
    
    console.log(`📝 Found ${accountantsWithoutUsers.rows.length} accountants without user accounts`);
    
    // Get Comptable role ID
    const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Comptable']);
    if (roleResult.rows.length === 0) {
      throw new Error('Comptable role not found');
    }
    const roleId = roleResult.rows[0].id;
    
    for (const accountant of accountantsWithoutUsers.rows) {
      console.log(`🔧 Creating user account for ${accountant.name} (${accountant.email})`);
      
      try {
        // Start transaction
        await client.query('BEGIN');
        
        // Create username from email
        const username = accountant.email.split('@')[0];
        const firstName = accountant.name.split(' ')[0] || accountant.name;
        const lastName = accountant.name.split(' ').slice(1).join(' ') || '';
        
        // Use existing password or default
        let hashedPassword = accountant.password;
        if (!hashedPassword) {
          const defaultPassword = 'wael123';
          hashedPassword = await bcrypt.hash(defaultPassword, 10);
        }
        
        // Create user account
        const userResult = await client.query(`
          INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_active, email_verified)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [username, accountant.email, hashedPassword, firstName, lastName, accountant.phone, true, true]);
        
        const userId = userResult.rows[0].id;
        
        // Assign Comptable role to user
        await client.query(`
          INSERT INTO user_roles (user_id, role_id, assigned_by)
          VALUES ($1, $2, $3)
        `, [userId, roleId, userId]);
        
        await client.query('COMMIT');
        console.log(`  ✅ Created user account for ${accountant.email}`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`  ❌ Error creating user account for ${accountant.email}:`, error.message);
      }
    }
    
    console.log('✅ All missing user accounts have been created');
    console.log('📝 Accountants can now log in with their email and password: wael123');
    
  } catch (error) {
    console.error('❌ Error creating missing user accounts:', error);
    throw error;
  } finally {
    client.release();
    pool.end();
  }
};

createAccountantUserAccounts()
  .then(() => {
    console.log('✅ User account creation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ User account creation failed:', error);
    process.exit(1);
  }); 