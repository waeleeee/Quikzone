const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testArticleAndRemarkFields() {
  try {
    console.log('🧪 Testing article_name and remark fields...\n');

    // Test 1: Create a parcel with article_name and remark
    console.log('1️⃣ Creating parcel with article_name and remark...');
    const createData = {
      tracking_number: 'TEST-' + Date.now(),
      shipper_id: 39, // Ritej Chaieb
      destination: 'adem cherni - kef west lbled, Kef',
      status: 'En attente',
      weight: 12,
      price: 99,
      delivery_fees: 9.80,
      type: 'Livraison',
      estimated_delivery_date: '2025-08-01',
      recipient_name: 'adem cherni',
      recipient_phone: '29242625',
      recipient_phone2: '',
      recipient_address: 'kef west lbled',
      recipient_governorate: 'Kef',
      article_name: 'adem cherni coli',
      remark: 'leezemha tousel ghodwa please'
    };

    const createResponse = await axios.post(`${API_BASE_URL}/parcels`, createData);
    console.log('✅ Parcel created:', createResponse.data.data);
    console.log('📦 Article name:', createResponse.data.data.article_name);
    console.log('📝 Remark:', createResponse.data.data.remark);
    console.log('');

    // Test 2: Get the parcel by ID
    const parcelId = createResponse.data.data.id;
    console.log('2️⃣ Getting parcel by ID...');
    const getResponse = await axios.get(`${API_BASE_URL}/parcels/${parcelId}`);
    console.log('✅ Parcel retrieved:', getResponse.data.data);
    console.log('📦 Article name:', getResponse.data.data.article_name);
    console.log('📝 Remark:', getResponse.data.data.remark);
    console.log('');

    // Test 3: Get all parcels to see the new fields
    console.log('3️⃣ Getting all parcels...');
    const getAllResponse = await axios.get(`${API_BASE_URL}/parcels`);
    const parcelsWithArticleName = getAllResponse.data.data.filter(p => p.article_name);
    console.log(`✅ Found ${parcelsWithArticleName.length} parcels with article_name field`);
    
    if (parcelsWithArticleName.length > 0) {
      console.log('📦 Sample parcel with article_name:', {
        id: parcelsWithArticleName[0].id,
        tracking_number: parcelsWithArticleName[0].tracking_number,
        article_name: parcelsWithArticleName[0].article_name,
        remark: parcelsWithArticleName[0].remark
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testArticleAndRemarkFields(); 