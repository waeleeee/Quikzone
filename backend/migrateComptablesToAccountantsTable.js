const db = require('./config/database');

async function migrateComptablesToAccountantsTable() {
  try {
    console.log('🔄 Migrating comptables from users table to accountants table...\n');

    // First, check what data exists in both tables
    console.log('📋 Current accountants table:');
    const accountantsResult = await db.query(`
      SELECT id, name, email, phone, title, agency, governorate, address
      FROM accountants
      ORDER BY id
    `);
    
    console.log(`Found ${accountantsResult.rows.length} records in accountants table`);
    accountantsResult.rows.forEach(acc => {
      console.log(`  ID: ${acc.id}, Name: ${acc.name}, Email: ${acc.email}`);
    });

    console.log('\n👤 Current users table (comptables):');
    const usersResult = await db.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone,
             r.name as role
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Finance' OR r.name = 'Comptable'
      ORDER BY u.id
    `);
    
    console.log(`Found ${usersResult.rows.length} comptable users in users table`);
    usersResult.rows.forEach(user => {
      console.log(`  ID: ${user.id}, Name: ${user.first_name} ${user.last_name}, Email: ${user.email}, Role: ${user.role}`);
    });

    if (usersResult.rows.length === 0) {
      console.log('❌ No comptable users found in users table');
      return;
    }

    // Migrate users to accountants table
    console.log('\n🔄 Starting migration...');
    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of usersResult.rows) {
      try {
        // Check if accountant already exists
        const existingAccountant = await db.query(
          'SELECT id FROM accountants WHERE email = $1',
          [user.email]
        );

        if (existingAccountant.rows.length > 0) {
          console.log(`⏭️  Skipping ${user.email} - already exists in accountants table`);
          skippedCount++;
          continue;
        }

        // Create accountant record
        const fullName = `${user.first_name} ${user.last_name}`.trim();
        const result = await db.query(`
          INSERT INTO accountants (name, email, phone, governorate, address, title, agency)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, name, email
        `, [
          fullName,
          user.email,
          user.phone || '',
          'Tunis', // Default governorate
          '', // Default address
          'Comptable', // Default title
          'Siège' // Default agency
        ]);

        console.log(`✅ Migrated: ${result.rows[0].name} (${result.rows[0].email})`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrating ${user.email}:`, error.message);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`  ✅ Migrated: ${migratedCount} comptables`);
    console.log(`  ⏭️  Skipped: ${skippedCount} comptables (already exist)`);
    console.log(`  📋 Total in accountants table: ${accountantsResult.rows.length + migratedCount}`);

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const finalResult = await db.query(`
      SELECT id, name, email, phone, title, agency
      FROM accountants
      ORDER BY id
    `);
    
    console.log(`Final count: ${finalResult.rows.length} accountants`);
    finalResult.rows.forEach(acc => {
      console.log(`  ID: ${acc.id}, Name: ${acc.name}, Email: ${acc.email}`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateComptablesToAccountantsTable();
