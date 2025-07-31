const db = require('./config/database');

async function testDirectDatabase() {
  try {
    console.log('🔍 Testing direct database query for shipper data...\n');
    
    // Test 1: Direct shipper query
    console.log('📋 Test 1: Direct shipper query');
    const shipperResult = await db.query(`
      SELECT 
        id, name, email, phone, company, fiscal_number, 
        company_governorate, company_address
      FROM shippers 
      WHERE id = 39
    `);
    
    if (shipperResult.rows.length > 0) {
      const shipper = shipperResult.rows[0];
      console.log('✅ Shipper data from database:');
      console.log('  ID:', shipper.id);
      console.log('  Name:', shipper.name);
      console.log('  Email:', shipper.email);
      console.log('  Phone:', shipper.phone);
      console.log('  Company:', shipper.company);
      console.log('  Fiscal Number:', shipper.fiscal_number);
      console.log('  Company Governorate:', shipper.company_governorate);
      console.log('  Company Address:', shipper.company_address);
    } else {
      console.log('❌ No shipper found with ID 39');
    }
    
    // Test 2: Parcels with shipper data query (same as API endpoint)
    console.log('\n📦 Test 2: Parcels with shipper data query (API endpoint query)');
    const parcelsResult = await db.query(`
      SELECT 
        p.tracking_number,
        s.name as shipper_name, 
        s.email as shipper_email,
        s.phone as shipper_phone,
        s.company as shipper_company,
        s.company_name as shipper_company_name,
        s.code as shipper_code,
        s.fiscal_number as shipper_fiscal_number,
        s.tax_number as shipper_tax_number,
        s.company_governorate as shipper_company_governorate,
        s.company_address as shipper_company_address,
        s.city as shipper_city
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE s.email = 'ritejchaieb@icloud.com'
      LIMIT 1
    `);
    
    if (parcelsResult.rows.length > 0) {
      const parcel = parcelsResult.rows[0];
      console.log('✅ Parcel with shipper data from database:');
      console.log('  Tracking Number:', parcel.tracking_number);
      console.log('  Shipper Name:', parcel.shipper_name);
      console.log('  Shipper Phone:', parcel.shipper_phone);
      console.log('  Shipper Company:', parcel.shipper_company);
      console.log('  Shipper Fiscal Number:', parcel.shipper_fiscal_number);
      console.log('  Shipper Company Governorate:', parcel.shipper_company_governorate);
      console.log('  Shipper Company Address:', parcel.shipper_company_address);
    } else {
      console.log('❌ No parcels found for this expediteur');
    }
    
  } catch (error) {
    console.error('❌ Error in direct database test:', error);
  } finally {
    process.exit();
  }
}

testDirectDatabase(); 