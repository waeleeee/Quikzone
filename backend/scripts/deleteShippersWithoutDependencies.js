const db = require('../config/database');

async function deleteShippersWithoutDependencies() {
  try {
    console.log('🗑️ Deleting shippers without dependencies...');
    
    // Get all shippers
    const shippersResult = await db.query(`
      SELECT id, name, email, code
      FROM shippers
      ORDER BY name
    `);
    
    console.log(`📊 Found ${shippersResult.rows.length} total shippers`);
    
    let deletedCount = 0;
    let skippedCount = 0;
    
    for (const shipper of shippersResult.rows) {
      try {
        console.log(`\n🔍 Checking shipper: ${shipper.name} (${shipper.email})`);
        
        // Check payments
        const paymentsResult = await db.query('SELECT COUNT(*) as count FROM payments WHERE shipper_id = $1', [shipper.id]);
        const paymentsCount = parseInt(paymentsResult.rows[0].count);
        
        // Check parcels
        const parcelsResult = await db.query('SELECT COUNT(*) as count FROM parcels WHERE shipper_id = $1', [shipper.id]);
        const parcelsCount = parseInt(parcelsResult.rows[0].count);
        
        console.log(`   - Payments: ${paymentsCount}`);
        console.log(`   - Parcels: ${parcelsCount}`);
        
        if (paymentsCount === 0 && parcelsCount === 0) {
          console.log(`   ✅ No dependencies found - deleting...`);
          
          // Start transaction
          const client = await db.pool.connect();
          try {
            await client.query('BEGIN');
            
            // Delete the shipper
            const deleteResult = await client.query('DELETE FROM shippers WHERE id = $1 RETURNING id', [shipper.id]);
            
            if (deleteResult.rows.length === 0) {
              console.log(`   ❌ Failed to delete shipper`);
              await client.query('ROLLBACK');
              continue;
            }
            
            // Clean up associated user account
            const userResult = await client.query('SELECT id FROM users WHERE email = $1', [shipper.email]);
            if (userResult.rows.length > 0) {
              const userId = userResult.rows[0].id;
              
              // Remove user roles first
              await client.query('DELETE FROM user_roles WHERE user_id = $1', [userId]);
              
              // Then delete the user
              await client.query('DELETE FROM users WHERE id = $1', [userId]);
              
              console.log(`   ✅ Deleted user account for: ${shipper.email}`);
            }
            
            await client.query('COMMIT');
            deletedCount++;
            console.log(`   ✅ Successfully deleted shipper: ${shipper.name}`);
            
          } catch (error) {
            await client.query('ROLLBACK');
            console.log(`   ❌ Error deleting shipper: ${error.message}`);
          } finally {
            client.release();
          }
          
        } else {
          console.log(`   ⚠️ Has dependencies - skipping`);
          skippedCount++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing shipper ${shipper.name}:`, error.message);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   - Total shippers processed: ${shippersResult.rows.length}`);
    console.log(`   - Shippers deleted: ${deletedCount}`);
    console.log(`   - Shippers skipped (with dependencies): ${skippedCount}`);
    
    // Show remaining shippers
    const remainingResult = await db.query('SELECT name, email FROM shippers ORDER BY name');
    console.log(`\n📋 Remaining shippers (${remainingResult.rows.length}):`);
    remainingResult.rows.forEach((shipper, index) => {
      console.log(`   ${index + 1}. ${shipper.name} (${shipper.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error deleting shippers:', error);
  } finally {
    process.exit(0);
  }
}

deleteShippersWithoutDependencies(); 