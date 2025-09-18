const db = require('./config/database');

const fixChefAgenceUsersTable = async () => {
  try {
    console.log('🔍 Fixing Chef d\'agence users table data...\n');

    const userEmail = 'bensalah@quickzone.tn';

    // First, get the user's agency data from agency_managers table
    console.log('📋 Getting agency data from agency_managers table...');
    const agencyManagerResult = await db.query(`
      SELECT agency, governorate
      FROM agency_managers 
      WHERE email = $1
    `, [userEmail]);

    if (agencyManagerResult.rows.length === 0) {
      console.log('❌ No agency manager data found for:', userEmail);
      return;
    }

    const agencyData = agencyManagerResult.rows[0];
    console.log('✅ Agency manager data found:');
    console.log(`  - Agency: ${agencyData.agency}`);
    console.log(`  - Governorate: ${agencyData.governorate}`);

    // Update the users table with the correct agency and governorate
    console.log('\n📋 Updating users table...');
    const updateResult = await db.query(`
      UPDATE users 
      SET agency = $1, governorate = $2, updated_at = NOW()
      WHERE email = $3
    `, [agencyData.agency, agencyData.governorate, userEmail]);

    console.log('✅ Users table updated successfully');

    // Verify the update
    console.log('\n📋 Verifying the update...');
    const verifyResult = await db.query(`
      SELECT id, first_name, last_name, email, agency, governorate
      FROM users 
      WHERE email = $1
    `, [userEmail]);

    if (verifyResult.rows.length > 0) {
      const user = verifyResult.rows[0];
      console.log('✅ User data after update:');
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Name: ${user.first_name} ${user.last_name}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Agency: ${user.agency || 'NULL'}`);
      console.log(`  - Governorate: ${user.governorate || 'NULL'}`);
    }

    // Also check all Chef d'agence users to see if they need fixing
    console.log('\n📋 Checking all Chef d\'agence users...');
    const allChefAgenceResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.agency,
        u.governorate,
        am.agency as am_agency,
        am.governorate as am_governorate
      FROM users u
      LEFT JOIN agency_managers am ON u.email = am.email
      WHERE u.role = 'Chef d''agence'
      ORDER BY u.first_name, u.last_name
    `);

    console.log('📋 All Chef d\'agence users:');
    allChefAgenceResult.rows.forEach(user => {
      console.log(`\n  🔹 ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`     Users table - Agency: ${user.agency || 'NULL'}, Governorate: ${user.governorate || 'NULL'}`);
      console.log(`     Agency managers table - Agency: ${user.am_agency || 'NULL'}, Governorate: ${user.am_governorate || 'NULL'}`);
      
      if (user.agency !== user.am_agency || user.governorate !== user.am_governorate) {
        console.log(`     ⚠️ MISMATCH DETECTED!`);
      } else {
        console.log(`     ✅ Data matches`);
      }
    });

  } catch (error) {
    console.error('❌ Error fixing Chef d\'agence users table:', error);
  } finally {
    process.exit(0);
  }
};

fixChefAgenceUsersTable(); 