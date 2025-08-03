const { pool } = require('./config/database');

async function fixUsersTableRole() {
  try {
    console.log('🔧 Fixing role column in users table...');
    
    const email = 'nouveau.livreur3@quickzone.tn';
    
    // Update the role column in users table
    await pool.query(`
      UPDATE users 
      SET role = 'Livreurs'
      WHERE email = $1
    `, [email]);
    
    console.log('✅ Role updated in users table');
    
    // Verify the fix
    const userResult = await pool.query(`
      SELECT id, email, username, first_name, last_name, role, agency, governorate
      FROM users 
      WHERE email = $1
    `, [email]);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('👤 User after fix:', {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        agency: user.agency,
        governorate: user.governorate
      });
      
      if (user.role === 'Livreurs') {
        console.log('✅ Role successfully updated to Livreurs');
      } else {
        console.log('❌ Role still not correct:', user.role);
      }
    }
    
    console.log('\n🎉 Users table role fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixUsersTableRole(); 