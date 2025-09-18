const db = require('./config/database');

const debugWarehouseCreation = async () => {
  try {
    console.log('🔍 Debugging warehouse creation process...\n');

    // Test data for warehouse creation
    const testData = {
      name: 'Test Warehouse',
      governorate: 'Tunis',
      address: 'Test Address',
      manager_id: null, // Test without manager first
      capacity: 100,
      status: 'Actif'
    };

    console.log('📋 Test data:', testData);
    console.log('-' .repeat(50));

    // Test 1: Simple warehouse creation without manager
    console.log('🔧 Test 1: Creating warehouse without manager...');
    
    try {
      const result = await db.query(`
        INSERT INTO warehouses (name, governorate, address, manager_id, capacity, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [testData.name, testData.governorate, testData.address, testData.manager_id, testData.capacity, testData.status]);
      
      console.log('✅ Warehouse created successfully:', result.rows[0]);
      
      // Clean up
      await db.query('DELETE FROM warehouses WHERE name = $1', [testData.name]);
      console.log('✅ Test warehouse cleaned up');
      
    } catch (error) {
      console.error('❌ Error creating warehouse without manager:', error);
    }

    // Test 2: Check if we can connect to database properly
    console.log('\n🔧 Test 2: Testing database connection...');
    
    try {
      const client = await db.connect();
      console.log('✅ Database connection successful');
      
      // Test transaction
      await client.query('BEGIN');
      console.log('✅ Transaction started');
      
      await client.query('COMMIT');
      console.log('✅ Transaction committed');
      
      client.release();
      console.log('✅ Client released');
      
    } catch (error) {
      console.error('❌ Database connection/transaction error:', error);
    }

    // Test 3: Check agency_managers table structure
    console.log('\n🔧 Test 3: Checking agency_managers table...');
    
    try {
      const tableStructure = await db.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'agency_managers'
        ORDER BY ordinal_position
      `);
      
      console.log('✅ Agency managers table structure:');
      tableStructure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
    } catch (error) {
      console.error('❌ Error checking table structure:', error);
    }

    // Test 4: Check if there are any Chef d'agence users available
    console.log('\n🔧 Test 4: Checking available Chef d\'agence users...');
    
    try {
      const availableManagers = await db.query(`
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
        LEFT JOIN warehouses w ON u.id = w.manager_id
        WHERE u.is_active = true
          AND w.id IS NULL
          AND r.name = 'Chef d''agence'
        ORDER BY u.first_name, u.last_name
      `);
      
      console.log(`✅ Found ${availableManagers.rows.length} available Chef d'agence users:`);
      availableManagers.rows.forEach(user => {
        console.log(`  - ${user.first_name} ${user.last_name} (${user.email})`);
      });
      
    } catch (error) {
      console.error('❌ Error checking available managers:', error);
    }

  } catch (error) {
    console.error('❌ General error in debug:', error);
  } finally {
    process.exit(0);
  }
};

debugWarehouseCreation(); 