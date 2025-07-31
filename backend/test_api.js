const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const personnelRoutes = require('./routes/personnel');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/personnel', personnelRoutes);

// Test the agency managers endpoint
async function testAgencyManagersEndpoint() {
  try {
    console.log('Testing agency managers endpoint...');
    
    // Start server on a different port
    const server = app.listen(5001, () => {
      console.log('Test server running on port 5001');
    });

    // Wait a moment for server to start
    setTimeout(async () => {
      try {
        const axios = require('axios');
        const response = await axios.get('http://localhost:5001/api/personnel/agency-managers');
        console.log('API Response:', JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.error('API Error:', error.response?.data || error.message);
      } finally {
        server.close();
      }
    }, 1000);

  } catch (error) {
    console.error('Test error:', error);
  }
}

testAgencyManagersEndpoint(); 