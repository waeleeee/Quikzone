const { pool } = require('./config/database');

async function testLivreurId() {
  const client = await pool.connect();
  try {
    console.log('🔍 TESTING LIVREUR ID DEBUG\n');
    
    // Test with some common livreur IDs from our previous test
    const testIds = [322, 323, 320, 324, 318, 319, 321];
    
    for (const livreurId of testIds) {
      console.log(`\n🔍 Testing livreur ID: ${livreurId}`);
      
      // Check if user exists at all
      const userExistsQuery = 'SELECT id, first_name, last_name, role, email FROM users WHERE id = $1';
      const userExistsResult = await client.query(userExistsQuery, [livreurId]);
      
      if (userExistsResult.rows.length === 0) {
        console.log(`❌ User with ID ${livreurId} does not exist`);
        continue;
      }
      
      const user = userExistsResult.rows[0];
      console.log(`✅ User exists: ${user.first_name} ${user.last_name} (${user.role})`);
      
      // Check if user has correct role
      if (user.role === 'Livreurs' || user.role === 'Livreur') {
        console.log(`✅ User has correct role: ${user.role}`);
      } else {
        console.log(`❌ User has wrong role: ${user.role} (expected Livreurs or Livreur)`);
      }
      
      // Test the exact query used in mission creation
      const missionQuery = 'SELECT id, CONCAT(first_name, \' \', last_name) as name, governorate as agency FROM users WHERE id = $1 AND role IN (\'Livreurs\', \'Livreur\')';
      const missionResult = await client.query(missionQuery, [livreurId]);
      
      if (missionResult.rows.length > 0) {
        console.log(`✅ Mission creation query would succeed for ID ${livreurId}`);
        console.log(`   Result: ${missionResult.rows[0].name} (${missionResult.rows[0].agency})`);
      } else {
        console.log(`❌ Mission creation query would fail for ID ${livreurId}`);
      }
    }
    
    // Also test with a non-existent ID
    console.log('\n🔍 Testing with non-existent ID: 999');
    const nonExistentQuery = 'SELECT id, first_name, last_name, role FROM users WHERE id = $1';
    const nonExistentResult = await client.query(nonExistentQuery, [999]);
    
    if (nonExistentResult.rows.length === 0) {
      console.log('✅ Correctly identified non-existent user');
    } else {
      console.log('❌ Unexpectedly found user with ID 999');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

testLivreurId();













