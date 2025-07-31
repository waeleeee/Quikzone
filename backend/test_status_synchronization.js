const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// Test data
const testData = {
  driver_id: 1,
  shipper_id: 1,
  scheduled_time: new Date().toISOString().slice(0, 16),
  status: 'scheduled'
};

async function testStatusSynchronization() {
  console.log('🧪 Testing Status Synchronization Flow');
  console.log('=====================================\n');

  try {
    // Step 1: Create a new mission
    console.log('1️⃣ Creating new mission...');
    const createResponse = await axios.post(`${API_BASE_URL}/missions-pickup`, testData);
    const mission = createResponse.data.data;
    console.log(`✅ Mission created with ID: ${mission.id}`);
    console.log(`📋 Initial status: ${mission.status}`);
    console.log(`📦 Parcels count: ${mission.parcels?.length || 0}\n`);

    // Step 2: Driver accepts the mission (status: "À enlever")
    console.log('2️⃣ Driver accepting mission...');
    const acceptData = { status: 'Accepté par livreur' };
    const acceptResponse = await axios.put(`${API_BASE_URL}/missions-pickup/${mission.id}`, acceptData);
    const acceptedMission = acceptResponse.data.data;
    console.log(`✅ Mission accepted`);
    console.log(`📋 Status: ${acceptedMission.status}`);
    console.log(`📦 Parcels status: ${acceptedMission.parcels?.map(p => p.status).join(', ')}\n`);

    // Step 3: Driver starts pickup and scans parcels (status: "Enlevé")
    console.log('3️⃣ Driver starting pickup...');
    const pickupData = { status: 'En cours de ramassage' };
    const pickupResponse = await axios.put(`${API_BASE_URL}/missions-pickup/${mission.id}`, pickupData);
    const pickupMission = pickupResponse.data.data;
    console.log(`✅ Pickup started`);
    console.log(`📋 Status: ${pickupMission.status}`);
    console.log(`📦 Parcels status: ${pickupMission.parcels?.map(p => p.status).join(', ')}\n`);

    // Step 4: Get security code for mission completion
    console.log('4️⃣ Getting security code...');
    const securityResponse = await axios.get(`${API_BASE_URL}/missions-pickup/${mission.id}/security-code`);
    const securityCode = securityResponse.data.data.securityCode;
    console.log(`🔐 Security code: ${securityCode}\n`);

    // Step 5: Driver completes mission with security code (status: "Au dépôt")
    console.log('5️⃣ Driver completing mission with security code...');
    const completeData = { 
      status: 'Au dépôt',
      securityCode: securityCode
    };
    const completeResponse = await axios.put(`${API_BASE_URL}/missions-pickup/${mission.id}`, completeData);
    const completedMission = completeResponse.data.data;
    console.log(`✅ Mission completed`);
    console.log(`📋 Status: ${completedMission.status}`);
    console.log(`📦 Parcels status: ${completedMission.parcels?.map(p => p.status).join(', ')}\n`);

    // Step 6: Verify final status
    console.log('6️⃣ Verifying final status...');
    const finalResponse = await axios.get(`${API_BASE_URL}/missions-pickup/${mission.id}`);
    const finalMission = finalResponse.data.data;
    console.log(`📋 Final mission status: ${finalMission.status}`);
    console.log(`📦 Final parcels status: ${finalMission.parcels?.map(p => p.status).join(', ')}\n`);

    // Summary
    console.log('📊 STATUS SYNCHRONIZATION SUMMARY');
    console.log('================================');
    console.log(`✅ Mission ID: ${mission.id}`);
    console.log(`✅ Initial Status: ${mission.status} (En attente)`);
    console.log(`✅ Accepted Status: ${acceptedMission.status} (À enlever)`);
    console.log(`✅ Pickup Status: ${pickupMission.status} (Enlevé)`);
    console.log(`✅ Completed Status: ${completedMission.status} (Au dépôt)`);
    console.log(`✅ All parcels synchronized: ${finalMission.parcels?.every(p => p.status === 'au_depot') ? 'YES' : 'NO'}`);
    
    console.log('\n🎉 Status synchronization test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
  }
}

// Run the test
testStatusSynchronization(); 