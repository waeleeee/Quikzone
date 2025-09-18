const db = require('./config/database');

const debugChefAgenceData = async () => {
  try {
    console.log('🔍 Debugging Chef d\'agence data...\n');

    // Check the current user "Saadaoui Ossama"
    const userEmail = 'saadaouiossama@gmail.com';
    
    console.log('📋 Checking user data for:', userEmail);
    console.log('-' .repeat(50));
    
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

    // Check what warehouses exist
    console.log('\n📋 Checking all warehouses...');
    console.log('-' .repeat(50));
    
    const warehousesResult = await db.query(`
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
    warehousesResult.rows.forEach(warehouse => {
      console.log(`  - ${warehouse.name} (${warehouse.governorate}) - Manager: ${warehouse.manager_name || 'None'}`);
    });

    // Check what warehouses should be visible for this user's governorate
    console.log('\n📋 Checking what warehouses should be visible...');
    console.log('-' .repeat(50));
    
    const agencyManager = agencyManagerResult.rows[0];
    if (agencyManager && agencyManager.governorate) {
      const userGovernorate = agencyManager.governorate;
      console.log('📍 User governorate:', userGovernorate);
      
      const filteredWarehouses = warehousesResult.rows.filter(w => w.governorate === userGovernorate);
      console.log('🏢 Warehouses for user governorate:');
      if (filteredWarehouses.length > 0) {
        filteredWarehouses.forEach(warehouse => {
          console.log(`  - ${warehouse.name} (${warehouse.governorate})`);
        });
      } else {
        console.log('  ❌ No warehouses found for this governorate');
      }
    }

    // Check agency_managers table structure
    console.log('\n📋 Checking agency_managers table structure...');
    console.log('-' .repeat(50));
    
    const tableStructureResult = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'agency_managers'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Agency managers table columns:');
    tableStructureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

  } catch (error) {
    console.error('❌ Error debugging Chef d\'agence data:', error);
  } finally {
    process.exit(0);
  }
};

debugChefAgenceData(); 