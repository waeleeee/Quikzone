const db = require('../config/database');

const debugExpediteurData = async () => {
  try {
    console.log('🔍 Debugging expediteur data...\n');

    // Check shippers table structure first
    console.log('📋 Shippers table structure:');
    const structureResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'shippers' 
      ORDER BY ordinal_position
    `);
    console.table(structureResult.rows);

    // Check shippers table with correct columns
    console.log('\n📋 Shippers in database:');
    const shippersResult = await db.query('SELECT id, name, email, phone, company, fiscal_number FROM shippers LIMIT 10');
    console.table(shippersResult.rows);

    // Check parcels table with latest entries
    console.log('\n📦 Latest parcels in database:');
    const parcelsResult = await db.query(`
      SELECT 
        p.id, p.tracking_number, p.recipient_name, p.recipient_phone, p.recipient_phone2, 
        p.recipient_address, p.recipient_governorate, p.destination,
        s.name as shipper_name, s.phone as shipper_phone, s.fiscal_number as shipper_fiscal_number
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `);
    console.table(parcelsResult.rows);

    // Check if there are any expediteurs with the email from the form
    console.log('\n🔍 Looking for expediteur with email containing "ritej":');
    const expediteurResult = await db.query(`
      SELECT id, name, email, phone, company, fiscal_number 
      FROM shippers 
      WHERE email ILIKE '%ritej%' OR name ILIKE '%ritej%'
    `);
    console.table(expediteurResult.rows);

    console.log('\n✅ Debug completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
};

debugExpediteurData(); 