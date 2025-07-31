const db = require('../config/database');

const manageShipperPayments = async () => {
  try {
    console.log('🔍 Checking shippers with payments...\n');
    
    // Get all shippers with their payment counts
    const result = await db.query(`
      SELECT 
        s.id,
        s.code,
        s.name,
        s.email,
        COUNT(p.id) as payment_count,
        SUM(p.amount) as total_payments
      FROM shippers s
      LEFT JOIN payments p ON s.id = p.shipper_id
      GROUP BY s.id, s.code, s.name, s.email
      HAVING COUNT(p.id) > 0
      ORDER BY payment_count DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ No shippers with payments found.');
      return;
    }
    
    console.log('📊 Shippers with payments:');
    console.log('─'.repeat(80));
    console.log('ID  | Code   | Name                    | Email                    | Payments | Total Amount');
    console.log('─'.repeat(80));
    
    result.rows.forEach(row => {
      console.log(
        `${row.id.toString().padStart(3)} | ${row.code.padEnd(6)} | ${row.name.padEnd(24)} | ${row.email.padEnd(25)} | ${row.payment_count.toString().padStart(8)} | ${parseFloat(row.total_payments || 0).toFixed(2)}€`
      );
    });
    
    console.log('\n💡 To delete a shipper, you must first delete their payments.');
    console.log('   Use the following commands:');
    console.log('   1. To see payments for a specific shipper: node scripts/showShipperPayments.js <shipper_id>');
    console.log('   2. To delete payments for a shipper: node scripts/deleteShipperPayments.js <shipper_id>');
    console.log('   3. Then you can delete the shipper normally.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

manageShipperPayments(); 