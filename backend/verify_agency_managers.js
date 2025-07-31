const db = require('./config/database');

async function verifyAgencyManagers() {
  try {
    console.log('🔍 Verifying all agency managers have user accounts...');
    
    const result = await db.query(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.first_name, 
        u.last_name, 
        u.is_active, 
        r.name as role,
        am.agency
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN agency_managers am ON u.email = am.email
      WHERE u.email IN (SELECT email FROM agency_managers) 
      ORDER BY u.id
    `);
    
    console.log('\n✅ All agency managers now have user accounts:');
    console.log('='.repeat(80));
    
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, Username: ${row.username}, Email: ${row.email}`);
      console.log(`Name: ${row.first_name} ${row.last_name}, Role: ${row.role}, Agency: ${row.agency}`);
      console.log(`Active: ${row.is_active}`);
      console.log('-'.repeat(40));
    });
    
    console.log(`\n📊 Total: ${result.rows.length} agency managers with user accounts`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

verifyAgencyManagers(); 