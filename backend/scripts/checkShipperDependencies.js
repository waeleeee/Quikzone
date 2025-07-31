const db = require('../config/database');

async function checkShipperDependencies(shipperId) {
  try {
    console.log(`🔍 Checking dependencies for shipper ID: ${shipperId}`);
    
    // Get shipper info
    const shipperResult = await db.query('SELECT id, name, email FROM shippers WHERE id = $1', [shipperId]);
    if (shipperResult.rows.length === 0) {
      console.log('❌ Shipper not found');
      return;
    }
    
    const shipper = shipperResult.rows[0];
    console.log(`📋 Shipper: ${shipper.name} (${shipper.email})`);
    
    // Check payments
    const paymentsResult = await db.query('SELECT COUNT(*) as count FROM payments WHERE shipper_id = $1', [shipperId]);
    const paymentsCount = parseInt(paymentsResult.rows[0].count);
    console.log(`💰 Payments: ${paymentsCount}`);
    
    if (paymentsCount > 0) {
      const payments = await db.query('SELECT id, reference, amount, date FROM payments WHERE shipper_id = $1 LIMIT 5', [shipperId]);
      console.log('   Recent payments:');
      payments.rows.forEach(payment => {
        console.log(`     - ${payment.reference}: €${payment.amount} (${payment.date})`);
      });
    }
    
    // Check parcels
    const parcelsResult = await db.query('SELECT COUNT(*) as count FROM parcels WHERE shipper_id = $1', [shipperId]);
    const parcelsCount = parseInt(parcelsResult.rows[0].count);
    console.log(`📦 Parcels: ${parcelsCount}`);
    
    if (parcelsCount > 0) {
      const parcels = await db.query('SELECT id, tracking_number, status, created_date FROM parcels WHERE shipper_id = $1 LIMIT 5', [shipperId]);
      console.log('   Recent parcels:');
      parcels.rows.forEach(parcel => {
        console.log(`     - ${parcel.tracking_number}: ${parcel.status} (${parcel.created_date})`);
      });
    }
    
    // Check user account
    const userResult = await db.query('SELECT id, username, is_active FROM users WHERE email = $1', [shipper.email]);
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`👤 User account: ${user.username} (Active: ${user.is_active})`);
      
      // Check user roles
      const rolesResult = await db.query(`
        SELECT r.name 
        FROM user_roles ur 
        JOIN roles r ON ur.role_id = r.id 
        WHERE ur.user_id = $1
      `, [user.id]);
      
      console.log(`   Roles: ${rolesResult.rows.map(r => r.name).join(', ')}`);
    } else {
      console.log(`👤 User account: Not found`);
    }
    
    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   - Can be deleted: ${paymentsCount === 0 && parcelsCount === 0 ? '✅ Yes' : '❌ No'}`);
    
    if (paymentsCount > 0) {
      console.log(`   - Has ${paymentsCount} payments (must delete payments first)`);
    }
    if (parcelsCount > 0) {
      console.log(`   - Has ${parcelsCount} parcels (must delete parcels first)`);
    }
    
  } catch (error) {
    console.error('❌ Error checking shipper dependencies:', error);
  } finally {
    process.exit(0);
  }
}

// Get shipper ID from command line argument
const shipperId = process.argv[2];
if (!shipperId) {
  console.log('Usage: node checkShipperDependencies.js <shipper_id>');
  console.log('Example: node checkShipperDependencies.js 1');
  process.exit(1);
}

checkShipperDependencies(shipperId); 