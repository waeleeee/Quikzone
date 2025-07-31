const db = require('../config/database');

async function deleteAllShippersWithPayments() {
  try {
    console.log('🗑️ Deleting all shippers and their payments...');
    
    // Get all shippers
    const shippersResult = await db.query(`
      SELECT id, name, email, code
      FROM shippers
      ORDER BY name
    `);
    
    console.log(`📊 Found ${shippersResult.rows.length} shippers to delete`);
    
    let deletedShippers = 0;
    let deletedPayments = 0;
    let deletedUsers = 0;
    
    for (const shipper of shippersResult.rows) {
      try {
        console.log(`\n🔍 Processing shipper: ${shipper.name} (${shipper.email})`);
        
        // Start transaction
        const client = await db.pool.connect();
        try {
          await client.query('BEGIN');
          
          // Delete payments first
          const paymentsResult = await client.query('DELETE FROM payments WHERE shipper_id = $1 RETURNING id', [shipper.id]);
          const paymentsDeleted = paymentsResult.rows.length;
          deletedPayments += paymentsDeleted;
          console.log(`   💰 Deleted ${paymentsDeleted} payments`);
          
          // Delete parcels if any
          const parcelsResult = await client.query('DELETE FROM parcels WHERE shipper_id = $1 RETURNING id', [shipper.id]);
          const parcelsDeleted = parcelsResult.rows.length;
          console.log(`   📦 Deleted ${parcelsDeleted} parcels`);
          
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
            
            deletedUsers++;
            console.log(`   👤 Deleted user account for: ${shipper.email}`);
          }
          
          await client.query('COMMIT');
          deletedShippers++;
          console.log(`   ✅ Successfully deleted shipper: ${shipper.name}`);
          
        } catch (error) {
          await client.query('ROLLBACK');
          console.log(`   ❌ Error deleting shipper: ${error.message}`);
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
    console.log(`   - User accounts deleted: ${deletedUsers}`);
    
    // Check if any shippers remain
    const remainingResult = await db.query('SELECT COUNT(*) as count FROM shippers');
    const remainingCount = parseInt(remainingResult.rows[0].count);
    
    if (remainingCount === 0) {
      console.log(`\n✅ All shippers have been successfully deleted!`);
    } else {
      console.log(`\n⚠️ ${remainingCount} shippers still remain`);
    }
    
  } catch (error) {
    console.error('❌ Error deleting shippers:', error);
  } finally {
    process.exit(0);
  }
}

// Ask for confirmation
console.log('⚠️  WARNING: This will delete ALL shippers and their associated payments!');
console.log('This action cannot be undone.');
console.log('');
console.log('To proceed, run: node scripts/deleteAllShippersWithPayments.js --confirm');

if (process.argv.includes('--confirm')) {
  deleteAllShippersWithPayments();
} else {
  console.log('❌ Please add --confirm flag to proceed with deletion');
  process.exit(1);
} 