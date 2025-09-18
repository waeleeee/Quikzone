const db = require('./config/database');

const checkAvailableManagers = async () => {
  try {
    console.log('🔍 Checking available managers for warehouse assignment...\n');

    // Step 1: Check what roles exist in the system
    console.log('📋 Available roles in the system:');
    console.log('-' .repeat(50));
    
    const rolesResult = await db.query(`
      SELECT 
        r.id,
        r.name,
        COUNT(ur.user_id) as user_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id, r.name
      ORDER BY r.name
    `);
    
    console.table(rolesResult.rows);

    // Step 2: Check users with different roles that might be suitable for warehouse management
    console.log('\n👥 Users by role:');
    console.log('-' .repeat(50));
    
    const usersByRoleResult = await db.query(`
      SELECT 
        r.name as role_name,
        COUNT(u.id) as total_users,
        COUNT(CASE WHEN u.is_active THEN 1 END) as active_users,
        COUNT(CASE WHEN w.id IS NOT NULL THEN 1 END) as assigned_to_warehouse,
        COUNT(CASE WHEN u.is_active AND w.id IS NULL THEN 1 END) as available_for_assignment
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      LEFT JOIN users u ON ur.user_id = u.id
      LEFT JOIN warehouses w ON u.id = w.manager_id
      GROUP BY r.id, r.name
      ORDER BY r.name
    `);
    
    console.table(usersByRoleResult.rows);

    // Step 3: Check current warehouse managers
    console.log('\n🏢 Current warehouse managers:');
    console.log('-' .repeat(50));
    
    const warehouseManagersResult = await db.query(`
      SELECT 
        w.id as warehouse_id,
        w.name as warehouse_name,
        w.governorate,
        u.id as user_id,
        CONCAT(u.first_name, ' ', u.last_name) as manager_name,
        u.email as manager_email,
        u.phone as manager_phone,
        r.name as manager_role
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      ORDER BY w.name
    `);
    
    console.table(warehouseManagersResult.rows);

    // Step 4: Find available users for warehouse management
    console.log('\n✅ Available users for warehouse management:');
    console.log('-' .repeat(50));
    
         // Look for users with roles that might be suitable for warehouse management
     const availableUsersResult = await db.query(`
       SELECT 
         u.id,
         CONCAT(u.first_name, ' ', u.last_name) as name,
         u.email,
         u.phone,
         r.name as role,
         CASE WHEN u.is_active THEN 'Actif' ELSE 'Inactif' END as status
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       LEFT JOIN warehouses w ON u.id = w.manager_id
       WHERE u.is_active = true
         AND w.id IS NULL
         AND r.name IN ('Chef d''agence', 'Administration', 'Commercial', 'Expéditeur')
       ORDER BY r.name, u.first_name, u.last_name
     `);
    
    if (availableUsersResult.rows.length > 0) {
      console.table(availableUsersResult.rows);
    } else {
      console.log('❌ No available users found with suitable roles');
      
      // Let's check what users exist without role restrictions
      console.log('\n🔍 All active users not assigned to warehouses:');
      console.log('-' .repeat(50));
      
      const allAvailableUsersResult = await db.query(`
        SELECT 
          u.id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
          u.email,
          u.phone,
          r.name as role,
          CASE WHEN u.is_active THEN 'Actif' ELSE 'Inactif' END as status
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN warehouses w ON u.id = w.manager_id
        WHERE u.is_active = true
          AND w.id IS NULL
        ORDER BY r.name, u.first_name, u.last_name
      `);
      
      if (allAvailableUsersResult.rows.length > 0) {
        console.table(allAvailableUsersResult.rows);
      } else {
        console.log('❌ No active users found that are not assigned to warehouses');
      }
    }

    // Step 5: Check if there are any users with "expediteur" role
    console.log('\n📦 Users with "expediteur" role:');
    console.log('-' .repeat(50));
    
    const expediteurUsersResult = await db.query(`
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.phone,
        r.name as role,
        CASE WHEN u.is_active THEN 'Actif' ELSE 'Inactif' END as status
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE r.name ILIKE '%expediteur%'
        AND u.is_active = true
      ORDER BY u.first_name, u.last_name
    `);
    
    if (expediteurUsersResult.rows.length > 0) {
      console.table(expediteurUsersResult.rows);
    } else {
      console.log('❌ No users found with "expediteur" role');
    }

    console.log('\n✅ Available managers check completed!');
    console.log('\n📋 Summary:');
    console.log('- Check the roles that exist in your system');
    console.log('- Look for users with suitable roles for warehouse management');
    console.log('- Consider updating the role name in the API if needed');

  } catch (error) {
    console.error('❌ Error checking available managers:', error);
  } finally {
    process.exit(0);
  }
};

checkAvailableManagers(); 