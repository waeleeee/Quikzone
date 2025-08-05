const { pool } = require('../config/database');

async function cleanupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Check if tables exist before dropping
    const checkTableExists = async (tableName) => {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      return result.rows[0].exists;
    };

    // Tables to remove (duplicated/unused)
    const tablesToRemove = [
      'missions_pickup',           // Duplicate of pickup_missions
      'delivery_mission_parcels',  // Duplicate of mission_parcels
      'accountants',               // Unused
      'administrators',            // Redundant with users
      'agency_managers',           // Redundant with users
      'agency_members',            // Redundant with users
      'commercials',               // Unused
      'parcel_tracking_history',   // Redundant with parcel_timeline
      'warehouse_users'            // Redundant with users
    ];

    console.log('🔍 Checking and removing unused tables...');
    
    for (const tableName of tablesToRemove) {
      const exists = await checkTableExists(tableName);
      
      if (exists) {
        console.log(`🗑️  Dropping table: ${tableName}`);
        await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
        console.log(`✅ Dropped table: ${tableName}`);
      } else {
        console.log(`ℹ️  Table ${tableName} doesn't exist, skipping...`);
      }
    }

    // Check for any foreign key constraints that might be broken
    console.log('🔍 Checking for broken foreign key constraints...');
    
    const checkConstraints = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public';
    `);

    console.log('📋 Current foreign key constraints:');
    checkConstraints.rows.forEach(row => {
      console.log(`  - ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });

    // Show final table list
    const finalTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📋 Final database tables:');
    finalTables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n✅ Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the cleanup
cleanupDatabase()
  .then(() => {
    console.log('🎉 Database cleanup finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database cleanup failed:', error);
    process.exit(1);
  }); 