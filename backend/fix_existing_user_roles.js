const db = require('./config/database');

const fixExistingUserRoles = async () => {
  try {
    console.log('🔧 Fixing existing user roles...');
    
    // Update users.role to match user_roles.role for all users
    const updateResult = await db.query(`
      UPDATE users 
      SET role = r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE users.id = ur.user_id
        AND users.role != r.name
        AND users.role = 'Utilisateur'
    `);
    
    console.log(`✅ Updated ${updateResult.rowCount} users with correct roles`);
    
    // Verify the fix
    const verifyResult = await db.query(`
      SELECT COUNT(*) as mismatch_count
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.role != r.name OR (u.role IS NOT NULL AND r.name IS NULL)
    `);
    
    const mismatchCount = parseInt(verifyResult.rows[0].mismatch_count);
    
    if (mismatchCount === 0) {
      console.log('✅ All user roles are now correctly synchronized!');
    } else {
      console.log(`⚠️ Still found ${mismatchCount} users with role mismatches`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing user roles:', error);
    process.exit(1);
  }
};

fixExistingUserRoles(); 