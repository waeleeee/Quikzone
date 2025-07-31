const db = require('../config/database');

const addSamplePayments = async () => {
  try {
    console.log('💰 Adding sample payment data...\n');

    // First, get the shipper ID for wael_expediteur
    const shipperResult = await db.query(
      'SELECT id FROM shippers WHERE email = $1',
      ['wael_expediteur@quickzone.tn']
    );

    if (shipperResult.rows.length === 0) {
      console.log('❌ Shipper wael_expediteur@quickzone.tn not found');
      return;
    }

    const shipperId = shipperResult.rows[0].id;
    console.log(`✅ Found shipper ID: ${shipperId}`);

    // Sample payment data
    const samplePayments = [
      {
        shipper_id: shipperId,
        amount: 250.00,
        date: '2024-01-15',
        payment_method: 'Virement bancaire',
        reference: 'REF-001',
        status: 'paid',
        invoice_number: 'INV-001'
      },
      {
        shipper_id: shipperId,
        amount: 180.00,
        date: '2024-01-14',
        payment_method: 'Espèces',
        reference: 'REF-002',
        status: 'paid',
        invoice_number: 'INV-002'
      },
      {
        shipper_id: shipperId,
        amount: 320.00,
        date: '2024-01-13',
        payment_method: 'Chèque',
        reference: 'REF-003',
        status: 'pending',
        invoice_number: 'INV-003'
      },
      {
        shipper_id: shipperId,
        amount: 150.00,
        date: '2024-01-10',
        payment_method: 'Virement bancaire',
        reference: 'REF-004',
        status: 'paid',
        invoice_number: 'INV-004'
      },
      {
        shipper_id: shipperId,
        amount: 95.00,
        date: '2024-01-08',
        payment_method: 'Espèces',
        reference: 'REF-005',
        status: 'pending',
        invoice_number: 'INV-005'
      }
    ];

    // Insert sample payments
    for (const payment of samplePayments) {
      // Check if payment already exists
      const existingPayment = await db.query(
        'SELECT id FROM payments WHERE reference = $1',
        [payment.reference]
      );
      
      if (existingPayment.rows.length === 0) {
        await db.query(`
          INSERT INTO payments (shipper_id, amount, date, payment_method, reference, status, invoice_number)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          payment.shipper_id,
          payment.amount,
          payment.date,
          payment.payment_method,
          payment.reference,
          payment.status,
          payment.invoice_number
        ]);
        console.log(`✅ Added payment: ${payment.reference}`);
      } else {
        console.log(`⚠️  Payment ${payment.reference} already exists, skipping`);
      }
    }

    console.log('✅ Sample payments added successfully');
    
    // Verify the payments were added
    const verifyResult = await db.query(`
      SELECT p.*, s.name as shipper_name, s.email as shipper_email
      FROM payments p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE s.email = 'wael_expediteur@quickzone.tn'
      ORDER BY p.date DESC
    `);

    console.log(`\n📊 Found ${verifyResult.rows.length} payments for wael_expediteur:`);
    verifyResult.rows.forEach((payment, index) => {
      console.log(`${index + 1}. ${payment.reference} - ${payment.amount}€ - ${payment.status} - ${payment.payment_method}`);
    });

  } catch (error) {
    console.error('❌ Error adding sample payments:', error);
  } finally {
    process.exit(0);
  }
};

addSamplePayments(); 