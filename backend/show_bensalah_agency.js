const db = require('./config/database');

const showBensalahAgency = async () => {
  try {
    console.log('🔍 Showing agency data for bensalah@quickzone.tn...\n');

    const userEmail = 'bensalah@quickzone.tn';

    // Check agency_managers table
    console.log('📋 Checking agency_managers table...');
    console.log('-' .repeat(50));
    
    const agencyManagerResult = await db.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        agency,
        governorate,
        address,
        created_at,
        updated_at
      FROM agency_managers 
      WHERE email = $1
    `, [userEmail]);
    
    if (agencyManagerResult.rows.length > 0) {
      const agencyManager = agencyManagerResult.rows[0];
      console.log('✅ Found in agency_managers table:');
      console.log(`  - ID: ${agencyManager.id}`);
      console.log(`  - Name: ${agencyManager.name}`);
      console.log(`  - Email: ${agencyManager.email}`);
      console.log(`  - Phone: ${agencyManager.phone || 'Not provided'}`);
      console.log(`  - Agency: ${agencyManager.agency || 'NULL'}`);
      console.log(`  - Governorate: ${agencyManager.governorate || 'NULL'}`);
      console.log(`  - Address: ${agencyManager.address || 'Not provided'}`);
      console.log(`  - Created: ${agencyManager.created_at}`);
      console.log(`  - Updated: ${agencyManager.updated_at}`);
    } else {
      console.log('❌ Not found in agency_managers table');
    }

    // Check users table
    console.log('\n📋 Checking users table...');
    console.log('-' .repeat(50));
    
    const userResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.is_active,
        r.name as role,
        u.created_at
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
    `, [userEmail]);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('✅ Found in users table:');
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Name: ${user.first_name} ${user.last_name}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Phone: ${user.phone || 'Not provided'}`);
      console.log(`  - Role: ${user.role || 'No role assigned'}`);
      console.log(`  - Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log(`  - Created: ${user.created_at}`);
    } else {
      console.log('❌ Not found in users table');
    }

    // Check if there's a warehouse assigned to this user
    console.log('\n📋 Checking warehouses table...');
    console.log('-' .repeat(50));
    
    const warehouseResult = await db.query(`
      SELECT 
        w.id,
        w.name,
        w.governorate,
        w.address,
        w.manager_id,
        w.capacity,
        w.status,
        w.created_at
      FROM warehouses w
      INNER JOIN users u ON w.manager_id = u.id
      WHERE u.email = $1
    `, [userEmail]);
    
    if (warehouseResult.rows.length > 0) {
      const warehouse = warehouseResult.rows[0];
      console.log('✅ Found warehouse managed by this user:');
      console.log(`  - ID: ${warehouse.id}`);
      console.log(`  - Name: ${warehouse.name}`);
      console.log(`  - Governorate: ${warehouse.governorate}`);
      console.log(`  - Address: ${warehouse.address || 'Not provided'}`);
      console.log(`  - Manager ID: ${warehouse.manager_id}`);
      console.log(`  - Capacity: ${warehouse.capacity}`);
      console.log(`  - Status: ${warehouse.status}`);
      console.log(`  - Created: ${warehouse.created_at}`);
    } else {
      console.log('❌ No warehouse found managed by this user');
    }

    // Check all warehouses to see if any match the agency name
    console.log('\n📋 Checking all warehouses...');
    console.log('-' .repeat(50));
    
    const allWarehousesResult = await db.query(`
      SELECT 
        id,
        name,
        governorate,
        manager_id
      FROM warehouses
      ORDER BY name
    `);
    
    console.log('📋 All warehouses in system:');
    allWarehousesResult.rows.forEach(warehouse => {
      console.log(`  - ID: ${warehouse.id}, Name: ${warehouse.name}, Governorate: ${warehouse.governorate}, Manager ID: ${warehouse.manager_id || 'None'}`);
    });

    // Summary
    console.log('\n📋 Summary:');
    console.log('-' .repeat(50));
    
    if (agencyManagerResult.rows.length > 0) {
      const agencyManager = agencyManagerResult.rows[0];
      console.log(`✅ User agency: ${agencyManager.agency || 'NULL'}`);
      console.log(`✅ User governorate: ${agencyManager.governorate || 'NULL'}`);
      
      if (agencyManager.agency) {
        console.log(`✅ Agency is set to: "${agencyManager.agency}"`);
      } else {
        console.log('❌ Agency is NULL - this is the problem!');
      }
    } else {
      console.log('❌ User not found in agency_managers table');
    }

  } catch (error) {
    console.error('❌ Error showing bensalah agency:', error);
  } finally {
    process.exit(0);
  }
};

showBensalahAgency(); 