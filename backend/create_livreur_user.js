const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function createLivreurUser() {
  try {
    // User details
    const userData = {
      username: 'livreur_test',
      email: 'livreur@test.tn',
      password: 'livreur123',
      first_name: 'Test',
      last_name: 'Livreur',
      phone: '+21612345678',
      role: 'Livreur',
      agency: 'Tunis',
      governorate: 'Tunis'
    };

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [userData.email, userData.username]
    );

    if (existingUser.rows.length > 0) {
      console.log('❌ User already exists with this email or username');
      console.log('Existing user:', existingUser.rows[0]);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const result = await db.query(`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        first_name, 
        last_name, 
        phone, 
        role, 
        agency, 
        governorate,
        is_active, 
        email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING id, username, email, first_name, last_name, role, agency, governorate
    `, [
      userData.username,
      userData.email,
      hashedPassword,
      userData.first_name,
      userData.last_name,
      userData.phone,
      userData.role,
      userData.agency,
      userData.governorate,
      true,
      true
    ]);

    console.log('✅ Livreur user created successfully!');
    console.log('📋 User Details:');
    console.log('   ID:', result.rows[0].id);
    console.log('   Username:', result.rows[0].username);
    console.log('   Email:', result.rows[0].email);
    console.log('   Name:', `${result.rows[0].first_name} ${result.rows[0].last_name}`);
    console.log('   Role:', result.rows[0].role);
    console.log('   Agency:', result.rows[0].agency);
    console.log('   Governorate:', result.rows[0].governorate);
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('   Email:', userData.email);
    console.log('   Password:', userData.password);
    console.log('');
    console.log('💡 You can now use these credentials to log in to the system!');

    db.pool.end();
  } catch (error) {
    console.error('❌ Error creating user:', error);
    db.pool.end();
  }
}

createLivreurUser(); 