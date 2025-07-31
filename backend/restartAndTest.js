const { spawn } = require('child_process');
const axios = require('axios');

console.log('🔄 Restarting server and testing endpoints...\n');

// Function to test endpoints
const testEndpoints = async () => {
  try {
    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🧪 Testing endpoints...\n');
    
    // Test 1: Basic parcels endpoint
    try {
      const response1 = await axios.get('http://localhost:5000/api/parcels/test');
      console.log('✅ Test endpoint working:', response1.data);
    } catch (error) {
      console.log('❌ Test endpoint failed:', error.message);
    }
    
    // Test 2: Expediteur parcels endpoint
    try {
      const response2 = await axios.get('http://localhost:5000/api/parcels/expediteur/nadia.gharbi@email.com');
      console.log('✅ Expediteur parcels endpoint working');
      console.log('📦 Parcels found:', response2.data.data.parcels.length);
    } catch (error) {
      console.log('❌ Expediteur parcels endpoint failed:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
};

// Start the server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Test endpoints after server starts
testEndpoints();

// Handle server exit
server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
}); 