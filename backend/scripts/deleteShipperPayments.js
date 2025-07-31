const db = require('../config/database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const deleteShipperPayments = async (shipperId) => {
  try {
    if (!shipperId) {
      console.log('❌ Please provide a shipper ID');
      console.log('Usage: node scripts/deleteShipperPayments.js <shipper_id>');
      return;
    }
    
    console.log(`🔍 Checking payments for shipper ID: ${shipperId}\n`);
    
    // Get shipper info
    const shipperResult = await db.query('SELECT * FROM shippers WHERE id = $1', [shipperId]);
    if (shipperResult.rows.length === 0) {
      console.log('❌ Shipper not found');
      return;
    }
    
    const shipper = shipperResult.rows[0];
    console.log(`📋 Shipper: ${shipper.name} (${shipper.code})`);
    console.log(`📧 Email: ${shipper.email}`);
    console.log(`📞 Phone: ${shipper.phone || 'N/A'}`);
    console.log('─'.repeat(80));
    
    // Get payments for this shipper
    const paymentsResult = await db.query(`
      SELECT * FROM payments 
      WHERE shipper_id = $1 
      ORDER BY created_at DESC
    `, [shipperId]);
    
    if (paymentsResult.rows.length === 0) {
      console.log('✅ No payments found for this shipper.');
      return;
    }
    
    console.log('💰 Payments to be deleted:');
    console.log('─'.repeat(80));
    console.log('ID  | Amount  | Method           | Status    | Date       | Reference');
    console.log('─'.repeat(80));
    
    paymentsResult.rows.forEach(payment => {
      const date = new Date(payment.date).toLocaleDateString();
      console.log(
        `${payment.id.toString().padStart(3)} | ${parseFloat(payment.amount).toFixed(2).padStart(7)}€ | ${(payment.payment_method || 'N/A').padEnd(16)} | ${(payment.status || 'N/A').padEnd(9)} | ${date.padEnd(10)} | ${payment.reference || 'N/A'}`
      );
    });
    
    const totalAmount = paymentsResult.rows.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    console.log('─'.repeat(80));
    console.log(`Total: ${totalAmount.toFixed(2)}€ (${paymentsResult.rows.length} payments)`);
    
    console.log('\n⚠️  WARNING: This action cannot be undone!');
    const confirm = await question(`\nAre you sure you want to delete all payments for ${shipper.name}? (yes/no): `);
    
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      return;
    }
    
    // Delete all payments for this shipper
    const deleteResult = await db.query('DELETE FROM payments WHERE shipper_id = $1 RETURNING *', [shipperId]);
    
    console.log(`✅ Successfully deleted ${deleteResult.rows.length} payments for ${shipper.name}`);
    console.log(`💡 You can now delete the shipper if needed.`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
};

const shipperId = process.argv[2];
deleteShipperPayments(shipperId); 