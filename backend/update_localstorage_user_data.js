const db = require('./config/database');

const updateLocalStorageUserData = async () => {
  try {
    console.log('🔧 Updating localStorage user data...\n');

    const userEmail = 'saadaouiossama@gmail.com';
    
    console.log('📋 Getting updated user data for:', userEmail);
    console.log('-' .repeat(50));
    
    // Get the complete user data with agency manager information
    const userResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.is_active,
        r.name as role,
        am.agency,
        am.governorate,
        am.address as user_address
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN agency_managers am ON u.email = am.email
      WHERE u.email = $1
    `, [userEmail]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ User data from database:', user);
    
    // Create the updated user object for localStorage
    const updatedUserData = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
      agency: user.agency,
      governorate: user.governorate,
      address: user.user_address
    };
    
    console.log('📋 Updated user data for localStorage:', updatedUserData);
    console.log('📍 User governorate:', updatedUserData.governorate);
    console.log('🏢 User agency:', updatedUserData.agency);
    
    // Create a simple HTML file that will update localStorage
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Update User Data</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .success { color: green; }
        .error { color: red; }
        .info { color: blue; }
        button { padding: 10px 20px; margin: 10px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>🔧 Update User Data in localStorage</h1>
    
    <div id="status"></div>
    
    <div id="currentData">
        <h3>Current localStorage data:</h3>
        <pre id="currentUserData"></pre>
    </div>
    
    <div id="newData">
        <h3>New data to set:</h3>
        <pre id="newUserData"></pre>
    </div>
    
    <button onclick="updateUserData()">Update localStorage</button>
    <button onclick="goToDashboard()">Go to Dashboard</button>
    
    <script>
        const newUserData = ${JSON.stringify(updatedUserData)};
        
        function showStatus(message, type = 'info') {
            const statusDiv = document.getElementById('status');
            statusDiv.innerHTML = '<div class="' + type + '">' + message + '</div>';
        }
        
        function showCurrentData() {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
            document.getElementById('currentUserData').textContent = JSON.stringify(currentUser, null, 2);
        }
        
        function showNewData() {
            document.getElementById('newUserData').textContent = JSON.stringify(newUserData, null, 2);
        }
        
        function updateUserData() {
            try {
                // Update localStorage
                localStorage.setItem('currentUser', JSON.stringify(newUserData));
                
                showStatus('✅ User data updated successfully in localStorage!', 'success');
                showCurrentData();
                
                console.log('Updated user data:', newUserData);
            } catch (error) {
                showStatus('❌ Error updating localStorage: ' + error.message, 'error');
            }
        }
        
        function goToDashboard() {
            window.location.href = '/dashboard';
        }
        
        // Show initial data
        showCurrentData();
        showNewData();
        showStatus('Ready to update user data. Click "Update localStorage" to proceed.', 'info');
    </script>
</body>
</html>`;

    // Write the HTML file
    const fs = require('fs');
    const path = require('path');
    const htmlFilePath = path.join(__dirname, 'update_user_data.html');
    
    fs.writeFileSync(htmlFilePath, htmlContent);
    
    console.log('✅ HTML file created:', htmlFilePath);
    console.log('\n📋 Instructions:');
    console.log('1. Open this file in your browser: ' + htmlFilePath);
    console.log('2. Click "Update localStorage" button');
    console.log('3. Click "Go to Dashboard" to test the changes');
    console.log('\n🔍 Expected changes:');
    console.log('- User governorate should be: ' + updatedUserData.governorate);
    console.log('- User agency should be: ' + updatedUserData.agency);
    console.log('- Frontend should now show correct warehouse data');

  } catch (error) {
    console.error('❌ Error updating localStorage user data:', error);
  } finally {
    process.exit(0);
  }
};

updateLocalStorageUserData(); 