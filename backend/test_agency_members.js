const db = require('./config/database');

async function testAgencyMembers() {
  try {
    console.log('Testing Agency Members API...');
    
    const result = await db.query(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.phone,
        u.created_at,
        r.name as role,
        'Siège' as agency,
        'Tunis' as governorate,
        '' as address,
        'active' as status
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = $1 AND u.is_active = true
      ORDER BY u.created_at DESC
    `, ['Membre de l\'agence']);
    
    console.log('✅ Agency Members query successful!');
    console.log('Agency Members found:', result.rows.length);
    result.rows.forEach(user => {
      console.log('- ' + user.name + ' (' + user.email + ') - ' + user.role);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAgencyMembers(); 