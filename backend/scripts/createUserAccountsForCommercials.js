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

const createUserAccountsForCommercials = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating user accounts for existing commercials...');
    
    // Get all commercials that don't have corresponding user accounts
    const commercialsResult = await client.query(`
      SELECT c.id, c.name, c.email, c.phone, c.password
      FROM commercials c
      LEFT JOIN users u ON c.email = u.email
      WHERE u.id IS NULL
    `);
    
    if (commercialsResult.rows.length === 0) {
      console.log('✅ All commercials already have user accounts');
      return;
    }
    
    console.log(`📝 Found ${commercialsResult.rows.length} commercials without user accounts`);
    
    // Get Commercial role ID
    const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Commercial']);
    if (roleResult.rows.length === 0) {
      throw new Error('Commercial role not found');
    }
    const roleId = roleResult.rows[0].id;
    
    let createdCount = 0;
    
    for (const commercial of commercialsResult.rows) {
      try {
        await client.query('BEGIN');
        
        // Use existing password or create default
        let hashedPassword = commercial.password;
        if (!hashedPassword) {
          const defaultPassword = 'wael123';
          hashedPassword = await bcrypt.hash(defaultPassword, 10);
                      console.log(`📝 Using default password for ${commercial.email}: wael123`);
        }
        
        // Create user account
        const username = commercial.email.split('@')[0]; // Use email prefix as username
        const firstName = commercial.name.split(' ')[0] || commercial.name;
        const lastName = commercial.name.split(' ').slice(1).join(' ') || '';
        
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
        createdCount++;
        console.log(`✅ Created user account for ${commercial.email}`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed to create user account for ${commercial.email}:`, error.message);
      }
    }
    
    console.log(`✅ Successfully created ${createdCount} user accounts for commercials`);
    
  } catch (error) {
    console.error('❌ Error creating user accounts for commercials:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the migration
createUserAccountsForCommercials()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 