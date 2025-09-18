const db = require('./config/database');

const showExpediteursByWarehouse = async () => {
  try {
    console.log('🔍 Showing expéditeurs by Chef d\'agence warehouse name...\n');

    const chefAgenceEmail = 'bensalah@quickzone.tn';

    // First, get the Chef d'agence's warehouse name
    console.log('📋 Getting Chef d\'agence warehouse...');
    console.log('-' .repeat(50));
    
    const warehouseResult = await db.query(`
      SELECT 
        w.id,
        w.name as warehouse_name,
        w.governorate,
        w.address,
        w.manager_id,
        w.capacity,
        w.status
      FROM warehouses w
      INNER JOIN users u ON w.manager_id = u.id
      WHERE u.email = $1
    `, [chefAgenceEmail]);
    
    if (warehouseResult.rows.length === 0) {
      console.log('❌ No warehouse found for Chef d\'agence:', chefAgenceEmail);
      
      // Check if user exists
      const userResult = await db.query(`
        SELECT id, first_name, last_name, email
        FROM users
        WHERE email = $1
      `, [chefAgenceEmail]);
      
      if (userResult.rows.length > 0) {
        console.log('✅ User exists but no warehouse assigned');
        console.log('📋 All warehouses in system:');
        
        const allWarehousesResult = await db.query(`
          SELECT id, name, governorate, manager_id
          FROM warehouses
          ORDER BY name
        `);
        
        allWarehousesResult.rows.forEach(warehouse => {
          console.log(`  - ID: ${warehouse.id}, Name: ${warehouse.name}, Governorate: ${warehouse.governorate}, Manager ID: ${warehouse.manager_id || 'None'}`);
        });
      }
      return;
    }

    const warehouse = warehouseResult.rows[0];
    console.log('✅ Chef d\'agence warehouse found:');
    console.log(`  - ID: ${warehouse.id}`);
    console.log(`  - Name: ${warehouse.warehouse_name}`);
    console.log(`  - Governorate: ${warehouse.governorate}`);
    console.log(`  - Address: ${warehouse.address || 'Not provided'}`);
    console.log(`  - Manager ID: ${warehouse.manager_id}`);
    console.log(`  - Capacity: ${warehouse.capacity}`);
    console.log(`  - Status: ${warehouse.status}`);

    // Get expéditeurs where agency matches the warehouse name
    console.log('\n📋 Expéditeurs with agency = warehouse name:', warehouse.warehouse_name);
    console.log('-' .repeat(50));
    
    const expediteursResult = await db.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        agency,
        governorate,
        address,
        default_warehouse_id,
        commercial_id,
        delivery_fees,
        return_fees,
        status,
        created_at,
        updated_at
      FROM shippers
      WHERE agency = $1
      ORDER BY created_at DESC
    `, [warehouse.warehouse_name]);
    
    console.log(`📋 Total expéditeurs for warehouse "${warehouse.warehouse_name}": ${expediteursResult.rows.length}`);
    
    if (expediteursResult.rows.length > 0) {
      console.log('📋 Expéditeurs list:');
      expediteursResult.rows.forEach(expediteur => {
        console.log(`\n  🔹 ID: ${expediteur.id}`);
        console.log(`     Name: ${expediteur.name}`);
        console.log(`     Email: ${expediteur.email}`);
        console.log(`     Phone: ${expediteur.phone || 'Not provided'}`);
        console.log(`     Agency: ${expediteur.agency}`);
        console.log(`     Governorate: ${expediteur.governorate || 'NULL'}`);
        console.log(`     Address: ${expediteur.address || 'Not provided'}`);
        console.log(`     Default Warehouse ID: ${expediteur.default_warehouse_id || 'Not assigned'}`);
        console.log(`     Commercial ID: ${expediteur.commercial_id || 'Not assigned'}`);
        console.log(`     Delivery Fees: ${expediteur.delivery_fees || 'Not set'}`);
        console.log(`     Return Fees: ${expediteur.return_fees || 'Not set'}`);
        console.log(`     Status: ${expediteur.status || 'Not set'}`);
        console.log(`     Created: ${expediteur.created_at}`);
        console.log(`     Updated: ${expediteur.updated_at}`);
      });
    } else {
      console.log('⚠️ No expéditeurs found for this warehouse name');
      
      // Show all expéditeurs to see what agencies exist
      console.log('\n📋 All expéditeurs in system (for reference):');
      console.log('-' .repeat(50));
      
      const allExpediteursResult = await db.query(`
        SELECT id, name, email, agency, governorate
        FROM shippers
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      allExpediteursResult.rows.forEach(expediteur => {
        console.log(`  - ID: ${expediteur.id}, Name: ${expediteur.name}, Email: ${expediteur.email}, Agency: ${expediteur.agency || 'NULL'}, Governorate: ${expediteur.governorate || 'NULL'}`);
      });
    }

    // Also check agency_managers table for this user
    console.log('\n📋 Checking agency_managers table...');
    console.log('-' .repeat(50));
    
    const agencyManagerResult = await db.query(`
      SELECT agency, governorate
      FROM agency_managers 
      WHERE email = $1
    `, [chefAgenceEmail]);
    
    if (agencyManagerResult.rows.length > 0) {
      const agencyManager = agencyManagerResult.rows[0];
      console.log('✅ Agency manager data:');
      console.log(`  - Agency: ${agencyManager.agency || 'NULL'}`);
      console.log(`  - Governorate: ${agencyManager.governorate || 'NULL'}`);
      
      if (agencyManager.agency === warehouse.warehouse_name) {
        console.log('✅ Agency matches warehouse name!');
      } else {
        console.log('❌ Agency does not match warehouse name');
        console.log(`  - Agency: "${agencyManager.agency}"`);
        console.log(`  - Warehouse: "${warehouse.warehouse_name}"`);
      }
    } else {
      console.log('❌ No agency manager data found');
    }

  } catch (error) {
    console.error('❌ Error showing expéditeurs by warehouse:', error);
  } finally {
    process.exit(0);
  }
};

showExpediteursByWarehouse(); 