const db = require('./config/database');

const showExpediteurDetails = async () => {
  try {
    console.log('🔍 Showing details for expéditeur EXP029...\n');

    // Get expéditeur details from shippers table
    console.log('📋 Expéditeur Details:');
    console.log('-' .repeat(50));
    
    const expediteurResult = await db.query(`
      SELECT 
        s.id,
        s.name,
        s.email,
        s.phone,
        s.address,
        s.governorate,
        s.agency,
        s.default_warehouse_id,
        s.created_at,
        s.updated_at
      FROM shippers s
      WHERE s.id = $1
    `, ['EXP029']);
    
    if (expediteurResult.rows.length > 0) {
      const expediteur = expediteurResult.rows[0];
      console.log('✅ Expéditeur found:');
      console.log(`  - ID: ${expediteur.id}`);
      console.log(`  - Name: ${expediteur.name}`);
      console.log(`  - Email: ${expediteur.email}`);
      console.log(`  - Phone: ${expediteur.phone || 'Not provided'}`);
      console.log(`  - Address: ${expediteur.address || 'Not provided'}`);
      console.log(`  - Governorate: ${expediteur.governorate || 'Not provided'}`);
      console.log(`  - Agency: ${expediteur.agency || 'Not provided'}`);
      console.log(`  - Default Warehouse ID: ${expediteur.default_warehouse_id || 'Not assigned'}`);
      console.log(`  - Created: ${expediteur.created_at}`);
      console.log(`  - Updated: ${expediteur.updated_at}`);
    } else {
      console.log('❌ Expéditeur EXP029 not found');
      return;
    }

    // Get warehouse details if assigned
    if (expediteurResult.rows[0].default_warehouse_id) {
      console.log('\n📋 Warehouse Details:');
      console.log('-' .repeat(50));
      
      const warehouseResult = await db.query(`
        SELECT 
          w.id,
          w.name,
          w.governorate,
          w.address,
          w.capacity,
          w.status,
          w.created_at
        FROM warehouses w
        WHERE w.id = $1
      `, [expediteurResult.rows[0].default_warehouse_id]);
      
      if (warehouseResult.rows.length > 0) {
        const warehouse = warehouseResult.rows[0];
        console.log('✅ Warehouse found:');
        console.log(`  - ID: ${warehouse.id}`);
        console.log(`  - Name: ${warehouse.name}`);
        console.log(`  - Governorate: ${warehouse.governorate}`);
        console.log(`  - Address: ${warehouse.address || 'Not provided'}`);
        console.log(`  - Capacity: ${warehouse.capacity}`);
        console.log(`  - Status: ${warehouse.status}`);
        console.log(`  - Created: ${warehouse.created_at}`);
      } else {
        console.log('❌ Warehouse not found');
      }
    }

    // Get parcels created by this expéditeur
    console.log('\n📋 Parcels created by this expéditeur:');
    console.log('-' .repeat(50));
    
    const parcelsResult = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.status,
        p.warehouse_id,
        p.created_at,
        p.updated_at
      FROM parcels p
      WHERE p.expediteur_id = $1
      ORDER BY p.created_at DESC
      LIMIT 10
    `, ['EXP029']);
    
    console.log(`📋 Total parcels: ${parcelsResult.rows.length}`);
    
    if (parcelsResult.rows.length > 0) {
      console.log('📋 Recent parcels:');
      parcelsResult.rows.forEach(parcel => {
        console.log(`  - ID: ${parcel.id}, Tracking: ${parcel.tracking_number}, Status: ${parcel.status}, Warehouse: ${parcel.warehouse_id || 'Not assigned'}, Created: ${parcel.created_at}`);
      });
    } else {
      console.log('❌ No parcels found for this expéditeur');
    }

    // Get demands created by this expéditeur
    console.log('\n📋 Demands created by this expéditeur:');
    console.log('-' .repeat(50));
    
    const demandsResult = await db.query(`
      SELECT 
        d.id,
        d.expediteur_email,
        d.expediteur_name,
        d.expediteur_agency,
        d.status,
        d.notes,
        d.created_at,
        d.updated_at
      FROM demands d
      WHERE d.expediteur_email = $1
      ORDER BY d.created_at DESC
      LIMIT 10
    `, [expediteurResult.rows[0].email]);
    
    console.log(`📋 Total demands: ${demandsResult.rows.length}`);
    
    if (demandsResult.rows.length > 0) {
      console.log('📋 Recent demands:');
      demandsResult.rows.forEach(demand => {
        console.log(`  - ID: ${demand.id}, Agency: ${demand.expediteur_agency || 'Not set'}, Status: ${demand.status}, Created: ${demand.created_at}`);
        if (demand.notes) {
          console.log(`    Notes: ${demand.notes}`);
        }
      });
    } else {
      console.log('❌ No demands found for this expéditeur');
    }

    // Check if this expéditeur has a user account
    console.log('\n📋 User Account Check:');
    console.log('-' .repeat(50));
    
    const userResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.is_active,
        r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
    `, [expediteurResult.rows[0].email]);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('✅ User account found:');
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Name: ${user.first_name} ${user.last_name}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Phone: ${user.phone || 'Not provided'}`);
      console.log(`  - Role: ${user.role || 'No role assigned'}`);
      console.log(`  - Active: ${user.is_active ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ No user account found for this expéditeur');
    }

  } catch (error) {
    console.error('❌ Error showing expéditeur details:', error);
  } finally {
    process.exit(0);
  }
};

showExpediteurDetails(); 