const { pool } = require('./config/database');

async function checkUsersTable() {
  const client = await pool.connect();
  try {
    console.log('🔍 CHECKING USERS TABLE STRUCTURE\n');
    
    // Check all users with livreur-related roles
    console.log('1️⃣ All users with livreur-related roles:');
    const livreurUsers = await client.query(`
      SELECT id, first_name, last_name, email, role, agency, governorate, is_active
      FROM users 
      WHERE role ILIKE '%livreur%' OR role ILIKE '%driver%' OR role ILIKE '%chauffeur%'
      ORDER BY role, first_name
    `);
    console.log('Livreur users found:', livreurUsers.rows);
    
    // Check all distinct roles in the users table
    console.log('\n2️⃣ All distinct roles in users table:');
    const allRoles = await client.query(`
      SELECT DISTINCT role, COUNT(*) as count
      FROM users 
      GROUP BY role
      ORDER BY role
    `);
    console.log('All roles:', allRoles.rows);
    
    // Check if there are any users with role 'Livreur' (singular)
    console.log('\n3️⃣ Users with role "Livreur" (singular):');
    const singularLivreurs = await client.query(`
      SELECT id, first_name, last_name, email, role, agency, governorate
      FROM users 
      WHERE role = 'Livreur'
      ORDER BY first_name
    `);
    console.log('Singular livreurs:', singularLivreurs.rows);
    
    // Check if there are any users with role 'Livreurs' (plural)
    console.log('\n4️⃣ Users with role "Livreurs" (plural):');
    const pluralLivreurs = await client.query(`
      SELECT id, first_name, last_name, email, role, agency, governorate
      FROM users 
      WHERE role = 'Livreurs'
      ORDER BY first_name
    `);
    console.log('Plural livreurs:', pluralLivreurs.rows);
    
    // Check if there's a separate livreurs table
    console.log('\n5️⃣ Checking if there\'s a separate livreurs table:');
    try {
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name ILIKE '%livreur%'
      `);
      console.log('Tables with "livreur" in name:', tableCheck.rows);
    } catch (error) {
      console.log('Error checking tables:', error.message);
    }
    
    // Test the exact query used in the API
    console.log('\n6️⃣ Testing the API query for available livreurs:');
    const apiQuery = `
      SELECT id, CONCAT(first_name, ' ', last_name) as name, phone, email, agency, governorate
      FROM users 
      WHERE role IN ('Livreurs', 'Livreur') AND is_active = true
      ORDER BY name ASC
    `;
    
    try {
      const apiResult = await client.query(apiQuery);
      console.log('API query result count:', apiResult.rows.length);
      console.log('API query results:', apiResult.rows);
    } catch (error) {
      console.log('❌ API query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkUsersTable(); 