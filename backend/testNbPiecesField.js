const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testNbPiecesField() {
  try {
    console.log('🧪 Testing nb_pieces field...\n');

    // Test 1: Create a parcel with nb_pieces
    console.log('1️⃣ Creating parcel with nb_pieces = 12...');
    const createData = {
      tracking_number: 'TEST' + Date.now().toString().slice(-6),
      shipper_id: 39, // Ritej Chaieb
      destination: 'test client - test address, Test',
      status: 'En attente',
      weight: 10,
      price: 22,
      delivery_fees: 8.00,
      type: 'Livraison',
      estimated_delivery_date: '2025-08-01',
      recipient_name: 'test client',
      recipient_phone: '12345678',
      recipient_phone2: '',
      recipient_address: 'test address',
      recipient_governorate: 'Test',
      article_name: 'test article',
      remark: 'test remark',
      nb_pieces: 12
    };

    const createResponse = await axios.post(`${API_BASE_URL}/parcels`, createData);
    console.log('✅ Parcel created:', createResponse.data.data);
    console.log('📦 nb_pieces:', createResponse.data.data.nb_pieces);
    console.log('');

    // Test 2: Get the parcel by ID
    const parcelId = createResponse.data.data.id;
    console.log('2️⃣ Getting parcel by ID...');
    const getResponse = await axios.get(`${API_BASE_URL}/parcels/${parcelId}`);
    console.log('✅ Parcel retrieved:', getResponse.data.data);
    console.log('📦 nb_pieces:', getResponse.data.data.nb_pieces);
    console.log('');

    // Test 3: Get all parcels to see the new field
    console.log('3️⃣ Getting all parcels...');
    const getAllResponse = await axios.get(`${API_BASE_URL}/parcels`);
    const parcelsWithNbPieces = getAllResponse.data.data.filter(p => p.nb_pieces);
    console.log(`✅ Found ${parcelsWithNbPieces.length} parcels with nb_pieces field`);
    
    if (parcelsWithNbPieces.length > 0) {
      console.log('📦 Sample parcel with nb_pieces:', {
        id: parcelsWithNbPieces[0].id,
        tracking_number: parcelsWithNbPieces[0].tracking_number,
        nb_pieces: parcelsWithNbPieces[0].nb_pieces,
        article_name: parcelsWithNbPieces[0].article_name,
        remark: parcelsWithNbPieces[0].remark
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testNbPiecesField(); 