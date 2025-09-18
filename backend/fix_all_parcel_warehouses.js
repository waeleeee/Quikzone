const db = require('./config/database');

const fixAllParcelWarehouses = async () => {
  try {
    console.log('🔧 Fixing all parcel warehouse assignments...\n');

    // Get all parcels with their shipper agency
    const parcelsResult = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.warehouse_id,
        s.name as shipper_name,
        s.agency as shipper_agency,
        w.name as current_warehouse_name
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE s.agency IS NOT NULL
      ORDER BY p.created_at DESC
    `);

    console.log(`📦 Found ${parcelsResult.rows.length} parcels to process:\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const parcel of parcelsResult.rows) {
      console.log(`🔍 Processing parcel ${parcel.tracking_number}:`);
      console.log(`   Shipper: ${parcel.shipper_name} (${parcel.shipper_agency})`);
      console.log(`   Current warehouse: ${parcel.current_warehouse_name || 'NULL'}`);
      
      // Try to find warehouse by exact name match first
      let warehouseResult = await db.query(`
        SELECT id, name FROM warehouses WHERE name = $1
      `, [parcel.shipper_agency]);
      
      if (warehouseResult.rows.length === 0) {
        // If no exact match, try to find warehouse that contains the agency name
        warehouseResult = await db.query(`
          SELECT id, name FROM warehouses 
          WHERE name ILIKE $1 OR name ILIKE $2
        `, [`%${parcel.shipper_agency}%`, `Entrepôt ${parcel.shipper_agency}%`]);
      }
      
      if (warehouseResult.rows.length > 0) {
        const correctWarehouse = warehouseResult.rows[0];
        console.log(`   ✅ Found matching warehouse: ${correctWarehouse.name} (ID: ${correctWarehouse.id})`);
        
        // Check if the warehouse assignment is already correct
        if (parcel.warehouse_id === correctWarehouse.id) {
          console.log(`   ⏭️ Warehouse assignment already correct, skipping`);
          skippedCount++;
        } else {
          // Update the parcel's warehouse assignment
          await db.query(`
            UPDATE parcels 
            SET warehouse_id = $1, updated_at = NOW()
            WHERE id = $2
          `, [correctWarehouse.id, parcel.id]);
          
          console.log(`   ✅ Updated parcel warehouse assignment`);
          updatedCount++;
        }
      } else {
        console.log(`   ❌ No warehouse found for agency: ${parcel.shipper_agency}`);
      }
      console.log('');
    }

    console.log(`🎯 Summary:`);
    console.log(`   Total parcels processed: ${parcelsResult.rows.length}`);
    console.log(`   Successfully updated: ${updatedCount}`);
    console.log(`   Already correct (skipped): ${skippedCount}`);
    console.log(`   Failed to update: ${parcelsResult.rows.length - updatedCount - skippedCount}`);

    // Show the results after fixing for Chef d'agence
    console.log(`\n📦 Checking results for Chef d'agence:`);
    const chefAgenceEmail = 'bensalah@quickzone.tn';
    const chefResult = await db.query(`SELECT agency FROM agency_managers WHERE email = $1`, [chefAgenceEmail]);
    const chefAgency = chefResult.rows[0].agency;
    
    const filteredParcelsResult = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.destination,
        p.status,
        s.name as shipper_name,
        s.agency as shipper_agency,
        w.name as warehouse_name,
        w.id as warehouse_id
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE w.name = $1
      ORDER BY p.created_at DESC
    `, [chefAgency]);

    console.log(`📦 Parcels for "${chefAgency}" after fix:`);
    console.log(`Total: ${filteredParcelsResult.rows.length} parcels\n`);

    filteredParcelsResult.rows.forEach((parcel, index) => {
      console.log(`${index + 1}. ${parcel.tracking_number} - ${parcel.destination}`);
      console.log(`   Shipper: ${parcel.shipper_name} (${parcel.shipper_agency})`);
      console.log(`   Warehouse: ${parcel.warehouse_name} (ID: ${parcel.warehouse_id})`);
      console.log(`   Status: ${parcel.status}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
};

fixAllParcelWarehouses(); 