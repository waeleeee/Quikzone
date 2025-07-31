const db = require('../config/database');

const addMoreShippers = async () => {
  try {
    console.log('📦 Adding more shippers for Wael Commercial...');
    
    // Get Wael Commercial ID
    const commercialResult = await db.query(
      'SELECT id FROM commercials WHERE email = $1',
      ['wael_commercial@quickzone.tn']
    );
    
    if (commercialResult.rows.length === 0) {
      console.log('❌ Wael Commercial not found');
      return;
    }
    
    const waelCommercialId = commercialResult.rows[0].id;
    
    // Additional shippers data
    const additionalShippers = [
      {
        code: 'EXP004',
        name: 'Ahmed Ben Salem',
        email: 'ahmed.bensalem@email.com',
        phone: '+216 95 123 789',
        company: 'Ben Salem Trading',
        total_parcels: 38,
        delivered_parcels: 35,
        pending_parcels: 3,
        total_revenue: 1250.00,
        total_paid: 1100.00,
        status: 'active',
        tax_number: 'TN12345678901234',
        commercial_register: 'RC123456',
        city: 'Sousse'
      },
      {
        code: 'EXP005',
        name: 'Fatima Mansouri',
        email: 'fatima.mansouri@email.com',
        phone: '+216 98 456 123',
        company: 'Mansouri Import Export',
        total_parcels: 52,
        delivered_parcels: 48,
        pending_parcels: 4,
        total_revenue: 1800.00,
        total_paid: 1650.00,
        status: 'active',
        tax_number: 'TN98765432109876',
        commercial_register: 'RC654321',
        city: 'Sfax'
      },
      {
        code: 'EXP006',
        name: 'Karim Trabelsi',
        email: 'karim.trabelsi@email.com',
        phone: '+216 71 789 456',
        company: 'Trabelsi Logistics',
        total_parcels: 25,
        delivered_parcels: 22,
        pending_parcels: 3,
        total_revenue: 850.00,
        total_paid: 750.00,
        status: 'active',
        tax_number: 'TN45678912345678',
        commercial_register: 'RC789123',
        city: 'Monastir'
      },
      {
        code: 'EXP007',
        name: 'Nadia Gharbi',
        email: 'nadia.gharbi@email.com',
        phone: '+216 95 321 654',
        company: 'Gharbi Solutions',
        total_parcels: 41,
        delivered_parcels: 38,
        pending_parcels: 3,
        total_revenue: 1400.00,
        total_paid: 1300.00,
        status: 'active',
        tax_number: 'TN32165498765432',
        commercial_register: 'RC321654',
        city: 'Nabeul'
      },
      {
        code: 'EXP008',
        name: 'Hassan Ben Ali',
        email: 'hassan.benali@email.com',
        phone: '+216 98 654 321',
        company: 'Ben Ali Services',
        total_parcels: 33,
        delivered_parcels: 30,
        pending_parcels: 3,
        total_revenue: 1100.00,
        total_paid: 1000.00,
        status: 'active',
        tax_number: 'TN65432112345678',
        commercial_register: 'RC654321',
        city: 'Gabès'
      }
    ];
    
    // Insert additional shippers
    for (const shipper of additionalShippers) {
      await db.query(`
        INSERT INTO shippers (
          code, name, email, phone, company, total_parcels,
          delivered_parcels, pending_parcels, total_revenue, total_paid,
          status, tax_number, commercial_register, city, commercial_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        shipper.code, shipper.name, shipper.email, shipper.phone,
        shipper.company, shipper.total_parcels, shipper.delivered_parcels,
        shipper.pending_parcels, shipper.total_revenue, shipper.total_paid,
        shipper.status, shipper.tax_number, shipper.commercial_register,
        shipper.city, waelCommercialId
      ]);
    }
    
    console.log(`✅ Added ${additionalShippers.length} new shippers`);
    
    // Update commercial's clients_count
    const totalShippersResult = await db.query(`
      SELECT COUNT(*) as count FROM shippers WHERE commercial_id = $1
    `, [waelCommercialId]);
    
    const totalClients = parseInt(totalShippersResult.rows[0].count);
    await db.query(`
      UPDATE commercials 
      SET clients_count = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [totalClients, waelCommercialId]);
    
    console.log(`✅ Updated Wael Commercial's clients_count to ${totalClients}`);
    
    // Show all shippers for Wael Commercial
    const allShippersResult = await db.query(`
      SELECT id, name, email, company, total_parcels, delivered_parcels, status
      FROM shippers 
      WHERE commercial_id = $1
      ORDER BY name
    `, [waelCommercialId]);
    
    console.log('📦 All shippers for Wael Commercial:');
    allShippersResult.rows.forEach(shipper => {
      console.log(`  - ${shipper.name} (${shipper.company}) - ${shipper.total_parcels} parcels, ${shipper.delivered_parcels} delivered`);
    });
    
    console.log('✅ Additional shippers added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding shippers:', error);
  } finally {
    process.exit(0);
  }
};

addMoreShippers(); 