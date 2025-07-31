const db = require('../config/database');

async function migrateManagerFk() {
  try {
    console.log('🔄 Starting migration: sectors.manager_id -> agency_managers(id)');
    // 1. Drop the old foreign key
    await db.query(`ALTER TABLE sectors DROP CONSTRAINT IF EXISTS sectors_manager_id_fkey`);
    // 2. Add the new foreign key
    await db.query(`ALTER TABLE sectors ADD CONSTRAINT sectors_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES agency_managers(id) ON DELETE SET NULL`);
    console.log('✅ Migration complete: sectors.manager_id now references agency_managers(id)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateManagerFk(); 