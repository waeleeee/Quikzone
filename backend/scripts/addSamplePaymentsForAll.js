const db = require('../config/database');

const addSamplePaymentsForAll = async () => {
  try {
    console.log('💰 Adding sample payment data for all expéditeurs...\n');

    // Get all shippers
    const shippersResult = await db.query('SELECT id, name, email FROM shippers WHERE email IS NOT NULL');

    if (shippersResult.rows.length === 0) {
      console.log('❌ No shippers found');
      return;
    }

    console.log(`✅ Found ${shippersResult.rows.length} shippers`);

    // Sample payment data for each shipper
    const samplePayments = [
      {
        amount: 250.00,
        date: '2024-01-15',
        payment_method: 'Virement bancaire',
        reference: 'REF-001',
        status: 'paid',
        invoice_number: 'INV-001'
      },
      {
        amount: 180.00,
        date: '2024-01-14',
        payment_method: 'Espèces',
        reference: 'REF-002',
        status: 'paid',
        invoice_number: 'INV-002'
      },
      {
        amount: 320.00,
        date: '2024-01-13',
        payment_method: 'Chèque',
        reference: 'REF-003',
        status: 'pending',
        invoice_number: 'INV-003'
      },
      {
        amount: 150.00,
        date: '2024-01-10',
        payment_method: 'Virement bancaire',
        reference: 'REF-004',
        status: 'paid',
        invoice_number: 'INV-004'
      },
      {
        amount: 95.00,
        date: '2024-01-08',
        payment_method: 'Espèces',
        reference: 'REF-005',
        status: 'pending',
        invoice_number: 'INV-005'
      }
    ];

    // Add payments for each shipper
    for (const shipper of shippersResult.rows) {
      console.log(`\n📦 Adding payments for ${shipper.name} (${shipper.email})`);
      
      for (let i = 0; i < samplePayments.length; i++) {
        const payment = samplePayments[i];
        const uniqueReference = `${payment.reference}-${shipper.id}`;
        
        // Check if payment already exists
        const existingPayment = await db.query(
          'SELECT id FROM payments WHERE reference = $1',
          [uniqueReference]
        );
        
        if (existingPayment.rows.length === 0) {
          await db.query(`
            INSERT INTO payments (shipper_id, amount, date, payment_method, reference, status, invoice_number)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            shipper.id,
            payment.amount,
            payment.date,
            payment.payment_method,
            uniqueReference,
            payment.status,
            `${payment.invoice_number}-${shipper.id}`
          ]);
          console.log(`  ✅ Added payment: ${uniqueReference} - ${payment.amount}€`);
        } else {
          console.log(`  ⚠️  Payment ${uniqueReference} already exists, skipping`);
        }
      }
    }

    console.log('\n✅ Sample payments added successfully for all expéditeurs');
    
    // Verify the payments were added
    const verifyResult = await db.query(`
      SELECT p.*, s.name as shipper_name, s.email as shipper_email
      FROM payments p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      ORDER BY s.name, p.date DESC
    `);

    console.log(`\n📊 Found ${verifyResult.rows.length} total payments:`);
    const paymentsByShipper = {};
    verifyResult.rows.forEach(payment => {
      const shipperName = payment.shipper_name || 'Unknown';
      if (!paymentsByShipper[shipperName]) {
        paymentsByShipper[shipperName] = [];
      }
      paymentsByShipper[shipperName].push(payment);
    });

    Object.keys(paymentsByShipper).forEach(shipperName => {
      console.log(`\n${shipperName}:`);
      paymentsByShipper[shipperName].forEach(payment => {
        console.log(`  - ${payment.reference} - ${payment.amount}€ - ${payment.status} - ${payment.payment_method}`);
      });
    });

  } catch (error) {
    console.error('❌ Error adding sample payments:', error);
  } finally {
    process.exit(0);
  }
};

addSamplePaymentsForAll(); 