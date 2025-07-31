// Test script to verify the client code feature
const { apiService } = require('./src/services/api');

async function testClientCodeFeature() {
  console.log('🧪 Testing Client Code Feature...\n');
  
  try {
    // Test 1: Create a new parcel and verify client code is generated
    console.log('📦 Test 1: Creating a new parcel...');
    
    const testParcelData = {
      tracking_number: 'TEST-' + Date.now(),
      shipper_id: 1,
      destination: 'Test Client - Test Address, Tunis',
      status: 'En attente',
      weight: 1.5,
      price: 50.00,
      delivery_fees: 7.00,
      type: 'Livraison',
      recipient_name: 'Test Client',
      recipient_phone: '12345678',
      recipient_address: 'Test Address',
      recipient_governorate: 'Tunis',
      article_name: 'Test Article',
      remark: 'Test remark',
      nb_pieces: 1
    };
    
    const result = await apiService.createParcel(testParcelData);
    
    if (result.success && result.client_code) {
      console.log('✅ Parcel created successfully!');
      console.log(`🔐 Client Code: ${result.client_code}`);
      console.log(`📦 Parcel ID: ${result.data.id}`);
      console.log(`📋 Tracking Number: ${result.data.tracking_number}\n`);
    } else {
      console.log('❌ Failed to create parcel or no client code generated');
      return;
    }
    
    // Test 2: Fetch the parcel and verify client code is stored
    console.log('🔍 Test 2: Fetching the created parcel...');
    
    const fetchedParcel = await apiService.getParcel(result.data.id);
    
    if (fetchedParcel && fetchedParcel.client_code) {
      console.log('✅ Parcel fetched successfully!');
      console.log(`🔐 Stored Client Code: ${fetchedParcel.client_code}`);
      console.log(`📦 Parcel Status: ${fetchedParcel.status}`);
      console.log(`💰 Price: ${fetchedParcel.price} DT`);
      console.log(`🚚 Delivery Fees: ${fetchedParcel.delivery_fees} DT\n`);
    } else {
      console.log('❌ Failed to fetch parcel or client code not found');
    }
    
    // Test 3: Fetch all parcels and verify client codes are present
    console.log('📋 Test 3: Fetching all parcels...');
    
    const allParcels = await apiService.getParcels();
    
    if (allParcels && allParcels.length > 0) {
      console.log(`✅ Found ${allParcels.length} parcels`);
      
      const parcelsWithCodes = allParcels.filter(p => p.client_code);
      const parcelsWithoutCodes = allParcels.filter(p => !p.client_code);
      
      console.log(`🔐 Parcels with client codes: ${parcelsWithCodes.length}`);
      console.log(`❌ Parcels without client codes: ${parcelsWithoutCodes.length}`);
      
      if (parcelsWithCodes.length > 0) {
        console.log('\n📋 Sample parcels with client codes:');
        parcelsWithCodes.slice(0, 3).forEach((parcel, index) => {
          console.log(`${index + 1}. ${parcel.tracking_number} → Code: ${parcel.client_code}`);
        });
      }
    } else {
      console.log('❌ Failed to fetch parcels');
    }
    
    console.log('\n🎉 Client Code Feature Test Completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testClientCodeFeature();
}

module.exports = { testClientCodeFeature }; 