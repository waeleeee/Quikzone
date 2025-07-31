const https = require('https');
const http = require('http');

const makeRequest = (url, options, data) => {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

const testAdminPassword = async () => {
  try {
    console.log('🧪 Testing admin password functionality...');
    
    const baseUrl = 'http://localhost:5000/api';
    
    // Test 1: Create a new admin with password
    console.log('\n📝 Test 1: Creating new admin with password...');
    const createData = {
      name: 'Test Admin',
      email: 'testadmin@quickzone.tn',
      password: 'testpass123',
      phone: '+216 71 123 456',
      governorate: 'Tunis',
      address: 'Test Address',
      role: 'admin'
    };
    
    const createResponse = await makeRequest(`${baseUrl}/personnel/administrators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, createData);
    
    console.log('Create response status:', createResponse.status);
    console.log('Create response data:', createResponse.data);
    
    if (createResponse.data.success) {
      const adminId = createResponse.data.data.id;
      
      // Test 2: Update admin with new password
      console.log('\n📝 Test 2: Updating admin with new password...');
      const updateData = {
        name: 'Test Admin Updated',
        email: 'testadmin@quickzone.tn',
        password: 'newpass456',
        phone: '+216 71 123 456',
        governorate: 'Tunis',
        address: 'Updated Address',
        role: 'admin'
      };
      
      const updateResponse = await makeRequest(`${baseUrl}/personnel/administrators/${adminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      }, updateData);
      
      console.log('Update response status:', updateResponse.status);
      console.log('Update response data:', updateResponse.data);
      
      // Test 3: Try to login with the new password
      console.log('\n📝 Test 3: Testing login with new password...');
      const loginData = {
        email: 'testadmin@quickzone.tn',
        password: 'newpass456'
      };
      
      const loginResponse = await makeRequest(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, loginData);
      
      console.log('Login response status:', loginResponse.status);
      console.log('Login response data:', loginResponse.data);
      
    } else {
      console.log('❌ Failed to create admin:', createResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

testAdminPassword(); 