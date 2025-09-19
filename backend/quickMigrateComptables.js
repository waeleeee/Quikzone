const db = require('./config/database');

async function quickMigrate() {
  const client = await db.pool.connect();
  
  try {
    console.log('🔄 Quick migration of comptables...');

    // Get all comptable users
    const usersResult = await client.query(`
      SELECT DISTINCT u.id, u.email, u.first_name, u.last_name, u.phone
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name IN ('Finance', 'Comptable')
    `);

    console.log(`Found ${usersResult.rows.length} comptable users`);

    let migrated = 0;
    for (const user of usersResult.rows) {
      try {
        // Check if exists
        const exists = await client.query('SELECT id FROM accountants WHERE email = $1', [user.email]);
        if (exists.rows.length > 0) continue;

        // Insert
        const fullName = `${user.first_name} ${user.last_name}`.trim();
        await client.query(`
          INSERT INTO accountants (name, email, phone, governorate, address, title, agency)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [fullName, user.email, user.phone || '', 'Tunis', '', 'Comptable', 'Siège']);

        console.log(`✅ Migrated: ${fullName}`);
        migrated++;
      } catch (error) {
        console.log(`❌ Error: ${user.email} - ${error.message}`);
      }
    }

    console.log(`\n✅ Migration complete: ${migrated} comptables migrated`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

quickMigrate();
