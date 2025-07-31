const db = require('./config/database');

// Test data that matches what the frontend sends
const testParcelData = {
  tracking_number: "C-TEST123",
  shipper_id: 39, // Using the same shipper_id from the example
  destination: "Test Client - Test Address, Tunis",
  status: "En attente",
  weight: 1.5,
  price: 100.00,
  delivery_fees: 8.00,
  type: "Livraison",
  estimated_delivery_date: "2025-07-20",
  // Client information
  recipient_name: "Test Client",
  recipient_phone: "+216 20 123 456",
  recipient_phone2: "+216 20 654 321",
  recipient_address: "Test Address",
  recipient_governorate: "Tunis"
};

async function testParcelCreation() {
  try {
    console.log('🧪 Testing parcel creation with client data...');
    console.log('📦 Test data:', JSON.stringify(testParcelData, null, 2));
    
    const result = await db.query(`
      INSERT INTO parcels (
        tracking_number, shipper_id, destination, status, weight, price, type,
        estimated_delivery_date, delivery_fees, return_fees,
        recipient_name, recipient_phone, recipient_phone2, recipient_address, recipient_governorate
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      testParcelData.tracking_number, 
      testParcelData.shipper_id, 
      testParcelData.destination, 
      testParcelData.status, 
      testParcelData.weight, 
      testParcelData.price, 
      testParcelData.type, 
      testParcelData.estimated_delivery_date, 
      testParcelData.delivery_fees, 
      null, // return_fees
      testParcelData.recipient_name,
      testParcelData.recipient_phone,
      testParcelData.recipient_phone2,
      testParcelData.recipient_address,
      testParcelData.recipient_governorate
    ]);
    
    console.log('✅ Test parcel created successfully:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
    // Now let's check if we can retrieve it with the full query
    const retrievedParcel = await db.query(`
      SELECT 
        p.*,
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
      WHERE p.tracking_number = $1
    `, [testParcelData.tracking_number]);
    
    console.log('📋 Retrieved parcel with shipper data:');
    console.log(JSON.stringify(retrievedParcel.rows[0], null, 2));
    
    // Clean up - delete the test parcel
    await db.query('DELETE FROM parcels WHERE tracking_number = $1', [testParcelData.tracking_number]);
    console.log('🧹 Test parcel cleaned up');
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    process.exit();
  }
}

testParcelCreation(); 