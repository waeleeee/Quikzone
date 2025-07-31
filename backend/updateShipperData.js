const db = require('./config/database');

async function updateShipperData() {
  try {
    console.log('🔧 Updating Ritej Chaieb shipper data with correct information...');
    
    // Update the shipper data for Ritej Chaieb (shipper_id: 39)
    const result = await db.query(`
      UPDATE shippers 
      SET 
        fiscal_number = '23456789012345',
        company_governorate = 'Mahdia',
        company_address = 'ksour sef'
      WHERE id = 39
      RETURNING *
    `);
    
    if (result.rows.length > 0) {
      const updatedShipper = result.rows[0];
      console.log('✅ Shipper data updated successfully:');
      console.log('  Name:', updatedShipper.name);
      console.log('  Company:', updatedShipper.company);
      console.log('  Fiscal Number:', updatedShipper.fiscal_number);
      console.log('  Company Governorate:', updatedShipper.company_governorate);
      console.log('  Company Address:', updatedShipper.company_address);
      console.log('  Phone:', updatedShipper.phone);
    } else {
      console.log('⚠️  No shipper found with ID 39');
    }
    
    // Verify the update by checking the expediteur parcels endpoint data
    console.log('\n🔍 Verifying updated data in parcels query...');
    const verifyResult = await db.query(`
      SELECT 
        p.tracking_number,
        s.name as shipper_name,
        s.phone as shipper_phone,
        s.company as shipper_company,
        s.fiscal_number as shipper_fiscal_number,
        s.company_governorate as shipper_company_governorate,
        s.company_address as shipper_company_address
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.tracking_number = 'C-487317'
    `);
    
    if (verifyResult.rows.length > 0) {
      const parcel = verifyResult.rows[0];
      console.log('📦 Parcel C-487317 shipper data:');
      console.log('  Shipper Name:', parcel.shipper_name);
      console.log('  Shipper Phone:', parcel.shipper_phone);
      console.log('  Shipper Company:', parcel.shipper_company);
      console.log('  Shipper Fiscal Number:', parcel.shipper_fiscal_number);
      console.log('  Shipper Company Governorate:', parcel.shipper_company_governorate);
      console.log('  Shipper Company Address:', parcel.shipper_company_address);
    }
    
  } catch (error) {
    console.error('❌ Error updating shipper data:', error);
  } finally {
    process.exit();
  }
}

updateShipperData(); 