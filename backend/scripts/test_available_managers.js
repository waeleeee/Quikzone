const db = require('../config/database');

const testAvailableManagers = async () => {
  try {
    console.log('🧪 Testing available managers API...');

    // Test 1: Get all Chef d'agence users
    console.log('\n📋 All Chef d\'agence users:');
    const allChefAgencesResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        CASE WHEN u.is_active THEN 'Actif' ELSE 'Inactif' END as status
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE r.name = $1
      ORDER BY u.first_name, u.last_name
    `, ['Chef d\'agence']);
    console.table(allChefAgencesResult.rows);

    // Test 2: Get all warehouses with their managers
    console.log('\n🏢 Warehouses with assigned managers:');
    const warehousesWithManagersResult = await db.query(`
      SELECT 
        w.id as warehouse_id,
        w.name as warehouse_name,
        w.manager_id,
        CONCAT(u.first_name, ' ', u.last_name) as manager_name,
        u.email as manager_email
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      WHERE w.manager_id IS NOT NULL
      ORDER BY w.name
    `);
    console.table(warehousesWithManagersResult.rows);

    // Test 3: Get available managers (not assigned to any warehouse)
    console.log('\n✅ Available Chef d\'agence users (not assigned to any warehouse):');
    const availableManagersResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        CASE WHEN u.is_active THEN 'Actif' ELSE 'Inactif' END as status
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN warehouses w ON u.id = w.manager_id
      WHERE r.name = $1
        AND u.is_active = true
        AND w.id IS NULL
      ORDER BY u.first_name, u.last_name
    `, ['Chef d\'agence']);
    console.table(availableManagersResult.rows);

    console.log(`\n📊 Summary:`);
    console.log(`- Total Chef d'agence users: ${allChefAgencesResult.rows.length}`);
    console.log(`- Warehouses with assigned managers: ${warehousesWithManagersResult.rows.length}`);
    console.log(`- Available managers: ${availableManagersResult.rows.length}`);

    console.log('\n✅ Available managers test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing available managers:', error);
    process.exit(1);
  }
};

testAvailableManagers(); 