const axios = require('axios');

const testExpediteurParcelsWithData = async () => {
  try {
    console.log('🧪 Testing expediteur parcels endpoint with complete shipper data...\n');
    
    // Test with Ritej Chaieb's email
    const email = 'ritejchaieb@icloud.com';
    const response = await axios.get(`http://localhost:5000/api/parcels/expediteur/${encodeURIComponent(email)}`);
    
    console.log('✅ Expediteur parcels endpoint working');
    console.log('📊 Response structure:', {
      success: response.data.success,
      parcelsCount: response.data.data?.parcels?.length || 0
    });
    
    if (response.data.data?.parcels?.length > 0) {
      const firstParcel = response.data.data.parcels[0];
      console.log('\n📦 First parcel data:');
      console.log('  Tracking Number:', firstParcel.tracking_number);
      console.log('  Recipient Name:', firstParcel.recipient_name);
      console.log('  Recipient Phone:', firstParcel.recipient_phone);
      console.log('  Recipient Address:', firstParcel.recipient_address);
      console.log('  Price:', firstParcel.price);
      
      console.log('\n👤 Shipper data:');
      console.log('  Shipper Name:', firstParcel.shipper_name);
      console.log('  Shipper Phone:', firstParcel.shipper_phone);
      console.log('  Shipper Company:', firstParcel.shipper_company);
      console.log('  Shipper Fiscal Number:', firstParcel.shipper_fiscal_number);
      console.log('  Shipper Company Governorate:', firstParcel.shipper_company_governorate);
      console.log('  Shipper Company Address:', firstParcel.shipper_company_address);
      
      // Check if we have the new sample parcels
      const sampleParcels = response.data.data.parcels.filter(p => 
        ['C-487315', 'C-487316', 'C-487317'].includes(p.tracking_number)
      );
      
      if (sampleParcels.length > 0) {
        console.log('\n🎯 Sample parcels found:');
        sampleParcels.forEach(p => {
          console.log(`  ${p.tracking_number}: ${p.recipient_name} (${p.recipient_phone}) - ${p.price} DT`);
        });
      } else {
        console.log('\n⚠️  Sample parcels not found in response');
      }
    } else {
      console.log('⚠️  No parcels found for this expediteur');
    }
    
  } catch (error) {
    console.error('❌ Expediteur parcels endpoint failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
};

testExpediteurParcelsWithData(); 