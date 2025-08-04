const db = require('./config/database');

async function fixLivreurRole() {
  try {
    console.log('🔧 Fixing missing role for user 330...');
    
    // First, let's find the Livreur role ID
    const roleResult = await db.query(`
      SELECT id, name FROM roles WHERE name = 'Livreur'
    `);
    
    if (roleResult.rows.length === 0) {
      console.log('❌ Livreur role not found in database');
      return;
    }
    
    const livreurRoleId = roleResult.rows[0].id;
    console.log('🎭 Found Livreur role ID:', livreurRoleId);
    
    // Check if user already has any role
    const existingRole = await db.query(`
      SELECT * FROM user_roles WHERE user_id = 330
    `);
    
    if (existingRole.rows.length > 0) {
      console.log('⚠️ User already has a role, updating to Livreur...');
      await db.query(`
        UPDATE user_roles 
        SET role_id = $1, is_active = true, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = 330
      `, [livreurRoleId]);
    } else {
      console.log('➕ Adding Livreur role to user...');
      await db.query(`
        INSERT INTO user_roles (user_id, role_id, is_active, created_at, updated_at)
        VALUES (330, $1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [livreurRoleId]);
    }
    
    // Verify the fix
    const verifyResult = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.is_active,
        r.name as role_name, ur.is_active as role_active
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = 330
    `);
    
    console.log('✅ Verification result:', verifyResult.rows.length, 'records found');
    if (verifyResult.rows.length > 0) {
      console.log('✅ User role fixed:', verifyResult.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Fix error:', error);
  } finally {
    process.exit(0);
  }
}

fixLivreurRole(); 