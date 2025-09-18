const db = require('./config/database');

const checkSiegeAgency = async () => {
  try {
    console.log('🔍 Checking for "Siège" agency...\n');

    // Check all agency managers for "Siège"
    console.log('📋 All agency managers:');
    const allAgencyManagersResult = await db.query(`
      SELECT id, name, email, agency, governorate
      FROM agency_managers
      ORDER BY agency
    `);

    let siegeFound = false;
    allAgencyManagersResult.rows.forEach(am => {
      console.log(`  - ${am.name} (${am.email}): "${am.agency || 'NULL'}" - ${am.governorate || 'NULL'}`);
      if (am.agency === 'Siège') {
        siegeFound = true;
        console.log(`    ⚠️ FOUND "Siège" agency!`);
      }
    });

    if (!siegeFound) {
      console.log('\n✅ No "Siège" agency found in agency_managers table');
    }

    // Check all users for "Siège" agency
    console.log('\n📋 All users with agency data:');
    const allUsersResult = await db.query(`
      SELECT id, first_name, last_name, email, agency, governorate, role
      FROM users
      WHERE agency IS NOT NULL
      ORDER BY agency
    `);

    let siegeUserFound = false;
    allUsersResult.rows.forEach(user => {
      console.log(`  - ${user.first_name} ${user.last_name} (${user.email}): "${user.agency}" - ${user.governorate || 'NULL'} - Role: ${user.role}`);
      if (user.agency === 'Siège') {
        siegeUserFound = true;
        console.log(`    ⚠️ FOUND "Siège" agency in users table!`);
      }
    });

    if (!siegeUserFound) {
      console.log('\n✅ No "Siège" agency found in users table');
    }

    // Check all shippers for "Siège" agency
    console.log('\n📋 All shippers with agency data:');
    const allShippersResult = await db.query(`
      SELECT id, name, email, agency, governorate
      FROM shippers
      WHERE agency IS NOT NULL
      ORDER BY agency
    `);

    let siegeShipperFound = false;
    allShippersResult.rows.forEach(shipper => {
      console.log(`  - ${shipper.name} (${shipper.email}): "${shipper.agency}" - ${shipper.governorate || 'NULL'}`);
      if (shipper.agency === 'Siège') {
        siegeShipperFound = true;
        console.log(`    ⚠️ FOUND "Siège" agency in shippers table!`);
      }
    });

    if (!siegeShipperFound) {
      console.log('\n✅ No "Siège" agency found in shippers table');
    }

    // Check if there are any agency managers with NULL agency
    console.log('\n📋 Agency managers with NULL agency:');
    const nullAgencyManagersResult = await db.query(`
      SELECT id, name, email, agency, governorate
      FROM agency_managers
      WHERE agency IS NULL
    `);

    if (nullAgencyManagersResult.rows.length > 0) {
      nullAgencyManagersResult.rows.forEach(am => {
        console.log(`  - ${am.name} (${am.email}): NULL agency - ${am.governorate || 'NULL'}`);
      });
    } else {
      console.log('✅ No agency managers with NULL agency');
    }

    // Check if there are any users with NULL agency
    console.log('\n📋 Users with NULL agency:');
    const nullAgencyUsersResult = await db.query(`
      SELECT id, first_name, last_name, email, agency, governorate, role
      FROM users
      WHERE agency IS NULL AND role = 'Chef d''agence'
    `);

    if (nullAgencyUsersResult.rows.length > 0) {
      nullAgencyUsersResult.rows.forEach(user => {
        console.log(`  - ${user.first_name} ${user.last_name} (${user.email}): NULL agency - ${user.governorate || 'NULL'}`);
      });
    } else {
      console.log('✅ No Chef d\'agence users with NULL agency');
    }

  } catch (error) {
    console.error('❌ Error checking Siège agency:', error);
  } finally {
    process.exit(0);
  }
};

checkSiegeAgency(); 