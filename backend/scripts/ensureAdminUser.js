const db = require('../config/database');
const bcrypt = require('bcryptjs');

const ensureAdminUser = async () => {
  try {
    console.log('🔧 Ensuring admin user exists...\n');

    // Check if admin user exists
    const adminResult = await db.query(`
      SELECT u.id, u.username, u.email, r.name as role
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.email = 'admin@quickzone.tn' AND r.name = 'Administration'
    `);

    if (adminResult.rows.length > 0) {
      console.log('✅ Admin user already exists:', adminResult.rows[0]);
      return;
    }

    console.log('❌ Admin user not found. Creating...');

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Create admin user
      const userResult = await client.query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, email_verified) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id
      `, ['admin', 'admin@quickzone.tn', hashedPassword, 'Admin', 'QuickZone', true, true]);

      const userId = userResult.rows[0].id;
      console.log('✅ Created user with ID:', userId);

      // Get Administration role ID
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Administration']);
      if (roleResult.rows.length === 0) {
        throw new Error('Administration role not found');
      }

      const roleId = roleResult.rows[0].id;
      console.log('✅ Found Administration role with ID:', roleId);

      // Assign role to user
      await client.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by) 
        VALUES ($1, $2, $3)
      `, [userId, roleId, userId]);

      console.log('✅ Assigned Administration role to user');

      await client.query('COMMIT');
      console.log('🎉 Admin user created successfully!');
      console.log('📧 Email: admin@quickzone.tn');
      console.log('🔑 Password: admin123');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error ensuring admin user:', error);
  } finally {
    process.exit(0);
  }
};

ensureAdminUser(); 