const db = require('../config/database');

async function deleteAllShippersComplete() {
  try {
    console.log('🗑️ Deleting all shippers with complete dependency cleanup...');
    
    // Get all remaining shippers
    const shippersResult = await db.query(`
      SELECT id, name, email, code
      FROM shippers
      ORDER BY name
    `);
    
    console.log(`📊 Found ${shippersResult.rows.length} shippers to delete`);
    
    let deletedShippers = 0;
    let deletedPayments = 0;
    let deletedInvoices = 0;
    let deletedMissionParcels = 0;
    let deletedUsers = 0;
    
    for (const shipper of shippersResult.rows) {
      try {
        console.log(`\n🔍 Processing shipper: ${shipper.name} (${shipper.email})`);
        
        // Start transaction
        const client = await db.pool.connect();
        try {
          await client.query('BEGIN');
          
          // 1. Delete mission_parcels first (referenced by parcels)
          const missionParcelsResult = await client.query(`
            DELETE FROM mission_parcels 
            WHERE parcel_id IN (SELECT id FROM parcels WHERE shipper_id = $1)
            RETURNING id
          `, [shipper.id]);
          const missionParcelsDeleted = missionParcelsResult.rows.length;
          deletedMissionParcels += missionParcelsDeleted;
          console.log(`   🚚 Deleted ${missionParcelsDeleted} mission parcels`);
          
          // 2. Delete invoices that reference payments
          const invoicesResult = await client.query(`
            DELETE FROM invoices 
            WHERE payment_id IN (SELECT id FROM payments WHERE shipper_id = $1)
            RETURNING id
          `, [shipper.id]);
          const invoicesDeleted = invoicesResult.rows.length;
          deletedInvoices += invoicesDeleted;
          console.log(`   📄 Deleted ${invoicesDeleted} invoices`);
          
          // 3. Delete payments
          const paymentsResult = await client.query('DELETE FROM payments WHERE shipper_id = $1 RETURNING id', [shipper.id]);
          const paymentsDeleted = paymentsResult.rows.length;
          deletedPayments += paymentsDeleted;
          console.log(`   💰 Deleted ${paymentsDeleted} payments`);
          
          // 4. Delete parcels
          const parcelsResult = await client.query('DELETE FROM parcels WHERE shipper_id = $1 RETURNING id', [shipper.id]);
          const parcelsDeleted = parcelsResult.rows.length;
          console.log(`   📦 Deleted ${parcelsDeleted} parcels`);
          
          // 5. Delete the shipper
          const deleteResult = await client.query('DELETE FROM shippers WHERE id = $1 RETURNING id', [shipper.id]);
          
          if (deleteResult.rows.length === 0) {
            console.log(`   ❌ Failed to delete shipper`);
            await client.query('ROLLBACK');
            continue;
          }
          
          // 6. Clean up associated user account
          const userResult = await client.query('SELECT id FROM users WHERE email = $1', [shipper.email]);
          if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].id;
            
            // Remove user roles first
            await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
            
            // Then delete the user
            await client.query('DELETE FROM users WHERE id = $1', [userId]);
            
            deletedUsers++;
            console.log(`   👤 Deleted user account for: ${shipper.email}`);
          }
          
          await client.query('COMMIT');
          deletedShippers++;
          console.log(`   ✅ Successfully deleted shipper: ${shipper.name}`);
          
        } catch (error) {
          await client.query('ROLLBACK');
          console.log(`   ❌ Error deleting shipper: ${error.message}`);
          
          // Try alternative approach - just delete the shipper and let cascade handle it
          try {
            console.log(`   🔄 Trying alternative deletion approach...`);
            await client.query('BEGIN');
            
            // Delete shipper directly (let foreign key cascade handle dependencies)
            const directDeleteResult = await client.query('DELETE FROM shippers WHERE id = $1 RETURNING id', [shipper.id]);
            
            if (directDeleteResult.rows.length > 0) {
              // Clean up user account
              const userResult = await client.query('SELECT id FROM users WHERE email = $1', [shipper.email]);
              if (userResult.rows.length > 0) {
                const userId = userResult.rows[0].id;
                await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
                await client.query('DELETE FROM users WHERE id = $1', [userId]);
                deletedUsers++;
                console.log(`   👤 Deleted user account for: ${shipper.email}`);
              }
              
              await client.query('COMMIT');
              deletedShippers++;
              console.log(`   ✅ Successfully deleted shipper (alternative method): ${shipper.name}`);
            } else {
              await client.query('ROLLBACK');
              console.log(`   ❌ Alternative deletion also failed`);
            }
          } catch (altError) {
            await client.query('ROLLBACK');
            console.log(`   ❌ Alternative deletion failed: ${altError.message}`);
          }
        } finally {
          client.release();
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing shipper ${shipper.name}:`, error.message);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   - Shippers deleted: ${deletedShippers}`);
    console.log(`   - Payments deleted: ${deletedPayments}`);
    console.log(`   - Invoices deleted: ${deletedInvoices}`);
    console.log(`   - Mission parcels deleted: ${deletedMissionParcels}`);
    console.log(`   - User accounts deleted: ${deletedUsers}`);
    
    // Check if any shippers remain
    const remainingResult = await db.query('SELECT COUNT(*) as count FROM shippers');
    const remainingCount = parseInt(remainingResult.rows[0].count);
    
    if (remainingCount === 0) {
      console.log(`\n✅ All shippers have been successfully deleted!`);
    } else {
      console.log(`\n⚠️ ${remainingCount} shippers still remain`);
      
      // Show remaining shippers
      const remainingShippers = await db.query('SELECT name, email FROM shippers ORDER BY name');
      console.log(`\n📋 Remaining shippers:`);
      remainingShippers.rows.forEach((shipper, index) => {
        console.log(`   ${index + 1}. ${shipper.name} (${shipper.email})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error deleting shippers:', error);
  } finally {
    process.exit(0);
  }
}

// Ask for confirmation
console.log('⚠️  WARNING: This will delete ALL remaining shippers and ALL their dependencies!');
console.log('This includes payments, invoices, parcels, mission parcels, and user accounts.');
console.log('This action cannot be undone.');
console.log('');
console.log('To proceed, run: node scripts/deleteAllShippersComplete.js --confirm');

if (process.argv.includes('--confirm')) {
  deleteAllShippersComplete();
} else {
  console.log('❌ Please add --confirm flag to proceed with deletion');
  process.exit(1);
} 