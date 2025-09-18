const { pool } = require('./config/database');

async function testLivreurs() {
  const client = await pool.connect();
  try {
    console.log('🔍 TESTING LIVREURS DEBUG\n');
    
    // Test 1: Check all users with role 'Livreurs'
    console.log('1️⃣ All users with role "Livreurs":');
    const livreursResult = await client.query(`
      SELECT id, first_name, last_name, email, role, agency, governorate, is_active
      FROM users 
      WHERE role = 'Livreurs'
      ORDER BY first_name, last_name
    `);
    console.log('Livreurs found:', livreursResult.rows);
    
    if (livreursResult.rows.length === 0) {
      console.log('❌ No livreurs found in database!');
      return;
    }
    
    // Test 2: Check active livreurs only
    console.log('\n2️⃣ Active livreurs only:');
    const activeLivreursResult = await client.query(`
      SELECT id, first_name, last_name, email, role, agency, governorate
      FROM users 
      WHERE role = 'Livreurs' AND is_active = true
      ORDER BY first_name, last_name
    `);
    console.log('Active livreurs:', activeLivreursResult.rows);
    
    // Test 3: Check the exact query used in the API
    console.log('\n3️⃣ Testing the exact API query:');
    const apiQuery = `
      SELECT id, CONCAT(first_name, ' ', last_name) as name, phone, email, agency, governorate
      FROM users 
      WHERE role = 'Livreurs' AND is_active = true
      ORDER BY name ASC
    `;
    
    try {
      const apiResult = await client.query(apiQuery);
      console.log('API query result:', apiResult.rows);
    } catch (error) {
      console.log('❌ API query failed:', error.message);
    }
    
    // Test 4: Check if there are any users with different role names
    console.log('\n4️⃣ All user roles in database:');
    const rolesResult = await client.query(`
      SELECT DISTINCT role, COUNT(*) as count
      FROM users 
      GROUP BY role
      ORDER BY role
    `);
    console.log('User roles:', rolesResult.rows);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

testLivreurs();













