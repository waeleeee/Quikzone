const db = require('../config/database');
const bcrypt = require('bcryptjs');

const testDriverPassword = async () => {
  try {
    console.log('🧪 Testing driver password creation and user account synchronization...');
    
    // Test data
    const testDriver = {
      name: 'Test Driver',
      email: 'test.driver@quickzone.tn',
      phone: '123456789',
      governorate: 'Tunis',
      address: 'Test Address',
      vehicle: 'Test Vehicle',
      status: 'Disponible',
      cin_number: '12345678',
      driving_license: 'DL123456',
      car_number: 'TEST123',
      car_type: 'Test Car',
      insurance_number: 'INS123456',
      agency: 'Tunis',
      password: 'testpassword123'
    };
    
    console.log('📝 Test driver data:', {
      name: testDriver.name,
      email: testDriver.email,
      password: testDriver.password
    });
    
    // Check if test driver already exists
    const existingDriver = await db.query('SELECT id FROM drivers WHERE email = $1', [testDriver.email]);
    if (existingDriver.rows.length > 0) {
      console.log('⚠️  Test driver already exists, deleting...');
      await db.query('DELETE FROM drivers WHERE email = $1', [testDriver.email]);
    }
    
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [testDriver.email]);
    if (existingUser.rows.length > 0) {
      console.log('⚠️  Test user already exists, deleting...');
      await db.query('DELETE FROM users WHERE email = $1', [testDriver.email]);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(testDriver.password, 10);
    console.log('🔐 Password hashed successfully');
    
    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Generate unique username
      let username = testDriver.email.split('@')[0];
      let counter = 1;
      let uniqueUsername = username;
      while (true) {
        const existing = await client.query('SELECT id FROM users WHERE username = $1', [uniqueUsername]);
        if (existing.rows.length === 0) break;
        uniqueUsername = username + counter;
        counter++;
      }
      
      const firstName = testDriver.name.split(' ')[0] || testDriver.name;
      const lastName = testDriver.name.split(' ').slice(1).join(' ') || firstName;
      
      // Create user account
      console.log('👤 Creating user account...');
      const userResult = await client.query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING id, username, email, first_name, last_name
      `, [uniqueUsername, testDriver.email, hashedPassword, firstName, lastName]);
      
      const user = userResult.rows[0];
      console.log('✅ User account created:', {
        id: user.id,
        username: user.username,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`
      });
      
      // Assign "Livreurs" role
      console.log('🎭 Assigning "Livreurs" role...');
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Livreurs']);
      if (roleResult.rows.length > 0) {
        await client.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
        `, [user.id, roleResult.rows[0].id]);
        console.log('✅ "Livreurs" role assigned');
      } else {
        console.log('❌ "Livreurs" role not found');
      }
      
      // Create driver
      console.log('🚗 Creating driver...');
      const driverResult = await client.query(`
        INSERT INTO drivers (
          name, email, phone, governorate, address, vehicle, status,
          cin_number, driving_license, car_number, car_type, insurance_number, agency,
          password
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, name, email, 
                  CASE WHEN password IS NOT NULL THEN true ELSE false END as has_password
      `, [
        testDriver.name, testDriver.email, testDriver.phone, testDriver.governorate,
        testDriver.address, testDriver.vehicle, testDriver.status, testDriver.cin_number,
        testDriver.driving_license, testDriver.car_number, testDriver.car_type,
        testDriver.insurance_number, testDriver.agency, hashedPassword
      ]);
      
      const driver = driverResult.rows[0];
      console.log('✅ Driver created:', {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        hasPassword: driver.has_password
      });
      
      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      
      // Test login
      console.log('\n🔐 Testing login...');
      const loginResult = await client.query(`
        SELECT 
          u.id, u.username, u.email, u.password_hash, u.first_name, u.last_name,
          u.is_active, r.name as role
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE u.email = $1 AND u.is_active = true AND ur.is_active = true
      `, [testDriver.email]);
      
      if (loginResult.rows.length === 0) {
        console.log('❌ Login test failed - user not found');
      } else {
        const loginUser = loginResult.rows[0];
        const passwordValid = await bcrypt.compare(testDriver.password, loginUser.password_hash);
        
        console.log('📊 Login test results:');
        console.log('  - User found:', !!loginUser);
        console.log('  - Password valid:', passwordValid);
        console.log('  - User active:', loginUser.is_active);
        console.log('  - Role:', loginUser.role);
        
        if (passwordValid) {
          console.log('✅ Login test PASSED!');
        } else {
          console.log('❌ Login test FAILED - password invalid');
        }
      }
      
      // Clean up
      console.log('\n🧹 Cleaning up test data...');
      await client.query('DELETE FROM drivers WHERE email = $1', [testDriver.email]);
      await client.query('DELETE FROM users WHERE email = $1', [testDriver.email]);
      console.log('✅ Test data cleaned up');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
};

// Run the test
testDriverPassword()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 