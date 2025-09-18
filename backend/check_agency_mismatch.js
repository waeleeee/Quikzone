const db = require('./config/database');

const checkAgencyMismatch = async () => {
  try {
    console.log('🔍 Checking agency mismatch for shipper baboucha...\n');

    // Get shipper baboucha details
    console.log('📋 Getting shipper baboucha details...');
    const shipperResult = await db.query(`
      SELECT 
        id,
        name,
        email,
        agency,
        governorate,
        default_warehouse_id,
        created_at,
        updated_at
      FROM shippers
      WHERE name ILIKE '%baboucha%' OR email = 'testbensalhexp@quickzone.tn'
    `);

    if (shipperResult.rows.length === 0) {
      console.log('❌ Shipper baboucha not found');
      return;
    }

    const shipper = shipperResult.rows[0];
    console.log('✅ Shipper baboucha found:');
    console.log(`  - ID: ${shipper.id}`);
    console.log(`  - Name: ${shipper.name}`);
    console.log(`  - Email: ${shipper.email}`);
    console.log(`  - Agency: "${shipper.agency || 'NULL'}"`);
    console.log(`  - Governorate: ${shipper.governorate || 'NULL'}`);
    console.log(`  - Default Warehouse ID: ${shipper.default_warehouse_id || 'NULL'}`);
    console.log(`  - Created: ${shipper.created_at}`);
    console.log(`  - Updated: ${shipper.updated_at}`);

    // Get the agency manager details
    console.log('\n📋 Getting agency manager details...');
    const agencyManagerResult = await db.query(`
      SELECT 
        id,
        name,
        email,
        agency,
        governorate,
        created_at,
        updated_at
      FROM agency_managers
      WHERE email = 'bensalah@quickzone.tn'
    `);

    if (agencyManagerResult.rows.length === 0) {
      console.log('❌ Agency manager not found');
      return;
    }

    const agencyManager = agencyManagerResult.rows[0];
    console.log('✅ Agency manager found:');
    console.log(`  - ID: ${agencyManager.id}`);
    console.log(`  - Name: ${agencyManager.name}`);
    console.log(`  - Email: ${agencyManager.email}`);
    console.log(`  - Agency: "${agencyManager.agency || 'NULL'}"`);
    console.log(`  - Governorate: ${agencyManager.governorate || 'NULL'}`);
    console.log(`  - Created: ${agencyManager.created_at}`);
    console.log(`  - Updated: ${agencyManager.updated_at}`);

    // Check the mismatch
    console.log('\n📋 Agency Mismatch Analysis:');
    console.log(`  - Shipper agency: "${shipper.agency}"`);
    console.log(`  - Agency manager agency: "${agencyManager.agency}"`);
    
    if (shipper.agency === agencyManager.agency) {
      console.log('✅ Agencies match!');
    } else {
      console.log('❌ AGENCY MISMATCH DETECTED!');
      console.log('  This means the shipper was created with a different agency than the Chef d\'agence manages.');
    }

    // Check if the shipper's warehouse matches the agency manager's warehouse
    console.log('\n📋 Warehouse Analysis:');
    if (shipper.default_warehouse_id) {
      const warehouseResult = await db.query(`
        SELECT id, name, governorate, manager_id
        FROM warehouses
        WHERE id = $1
      `, [shipper.default_warehouse_id]);

      if (warehouseResult.rows.length > 0) {
        const warehouse = warehouseResult.rows[0];
        console.log('✅ Shipper\'s default warehouse:');
        console.log(`  - ID: ${warehouse.id}`);
        console.log(`  - Name: ${warehouse.name}`);
        console.log(`  - Governorate: ${warehouse.governorate}`);
        console.log(`  - Manager ID: ${warehouse.manager_id}`);
      }
    } else {
      console.log('⚠️ Shipper has no default warehouse assigned');
    }

    // Check what warehouse the agency manager manages
    const managerWarehouseResult = await db.query(`
      SELECT id, name, governorate, manager_id
      FROM warehouses
      WHERE manager_id = (SELECT id FROM users WHERE email = 'bensalah@quickzone.tn')
    `);

    if (managerWarehouseResult.rows.length > 0) {
      const managerWarehouse = managerWarehouseResult.rows[0];
      console.log('✅ Agency manager\'s warehouse:');
      console.log(`  - ID: ${managerWarehouse.id}`);
      console.log(`  - Name: ${managerWarehouse.name}`);
      console.log(`  - Governorate: ${managerWarehouse.governorate}`);
      console.log(`  - Manager ID: ${managerWarehouse.manager_id}`);
    } else {
      console.log('❌ Agency manager has no warehouse assigned');
    }

    // Check all agency managers to see if there's a "Siège" agency
    console.log('\n📋 All agency managers:');
    const allAgencyManagersResult = await db.query(`
      SELECT id, name, email, agency, governorate
      FROM agency_managers
      ORDER BY agency
    `);

    allAgencyManagersResult.rows.forEach(am => {
      console.log(`  - ${am.name} (${am.email}): "${am.agency || 'NULL'}" - ${am.governorate || 'NULL'}`);
    });

  } catch (error) {
    console.error('❌ Error checking agency mismatch:', error);
  } finally {
    process.exit(0);
  }
};

checkAgencyMismatch(); 