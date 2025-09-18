const db = require('./config/database');

const debugNewChefAgence = async () => {
  try {
    console.log('🔍 Debugging new Chef d\'agence user...\n');

    const userEmail = 'ibeabenzide@quickzone.tn';
    
    console.log('📋 Checking user data for:', userEmail);
    console.log('-' .repeat(50));
    
    // Check the user data
    const userResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
    `, [userEmail]);
    
    if (userResult.rows.length > 0) {
      console.log('✅ User found:', userResult.rows[0]);
    } else {
      console.log('❌ User not found');
      return;
    }

    // Check agency managers table for this user
    console.log('\n📋 Checking agency managers table...');
    console.log('-' .repeat(50));
    
    const agencyManagerResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        r.name as role,
        am.agency,
        am.governorate
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN agency_managers am ON u.email = am.email
      WHERE u.email = $1
    `, [userEmail]);
    
    if (agencyManagerResult.rows.length > 0) {
      const user = agencyManagerResult.rows[0];
      console.log('✅ Agency manager data:', user);
      console.log('📍 User governorate:', user.governorate);
      console.log('🏢 User agency:', user.agency);
    } else {
      console.log('❌ No agency manager data found');
    }

    // Check what warehouse this user manages
    console.log('\n📋 Checking warehouse assignment...');
    console.log('-' .repeat(50));
    
    const warehouseResult = await db.query(`
      SELECT 
        w.id,
        w.name,
        w.governorate,
        w.address,
        u.first_name || ' ' || u.last_name as manager_name,
        u.email as manager_email
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      WHERE u.email = $1
    `, [userEmail]);
    
    if (warehouseResult.rows.length > 0) {
      console.log('✅ User manages warehouse:', warehouseResult.rows[0]);
    } else {
      console.log('❌ User is not managing any warehouse');
    }

    // Check all warehouses
    console.log('\n📋 Checking all warehouses...');
    console.log('-' .repeat(50));
    
    const allWarehousesResult = await db.query(`
      SELECT 
        w.id,
        w.name,
        w.governorate,
        w.address,
        u.first_name || ' ' || u.last_name as manager_name,
        u.email as manager_email
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      ORDER BY w.name
    `);
    
    console.log('🏢 All warehouses:');
    allWarehousesResult.rows.forEach(warehouse => {
      console.log(`  - ${warehouse.name} (${warehouse.governorate}) - Manager: ${warehouse.manager_name || 'None'}`);
    });

    // Check if the user needs to be added to agency_managers table
    console.log('\n📋 Checking if user needs agency_managers entry...');
    console.log('-' .repeat(50));
    
    const agencyManagerEntry = await db.query(`
      SELECT * FROM agency_managers WHERE email = $1
    `, [userEmail]);
    
    if (agencyManagerEntry.rows.length === 0) {
      console.log('❌ User not in agency_managers table - this is the problem!');
      
      // Get the warehouse this user manages
      const userWarehouse = warehouseResult.rows[0];
      if (userWarehouse) {
        console.log('🔧 Adding user to agency_managers table...');
        
        const insertResult = await db.query(`
          INSERT INTO agency_managers (name, email, phone, governorate, agency, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [
          `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`,
          userEmail,
          userResult.rows[0].phone,
          userWarehouse.governorate,
          userWarehouse.name
        ]);
        
        if (insertResult.rowCount > 0) {
          console.log('✅ Successfully added user to agency_managers table');
          console.log(`📍 Set governorate to: ${userWarehouse.governorate}`);
          console.log(`🏢 Set agency to: ${userWarehouse.name}`);
        }
      } else {
        console.log('❌ Cannot add to agency_managers - user is not managing any warehouse');
      }
    } else {
      console.log('✅ User already in agency_managers table:', agencyManagerEntry.rows[0]);
    }

  } catch (error) {
    console.error('❌ Error debugging new Chef d\'agence:', error);
  } finally {
    process.exit(0);
  }
};

debugNewChefAgence(); 