const db = require('./config/database');

async function checkPickupTables() {
  try {
    console.log('🔍 Checking pickup tables...');
    
    // Check if pickup_missions table exists
    const missionsTableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pickup_missions'
      );
    `);
    
    console.log('📋 pickup_missions table exists:', missionsTableCheck.rows[0].exists);
    
    if (missionsTableCheck.rows[0].exists) {
      const missionsCount = await db.query('SELECT COUNT(*) FROM pickup_missions');
      console.log('📦 Number of missions:', missionsCount.rows[0].count);
      
      const missions = await db.query('SELECT * FROM pickup_missions LIMIT 5');
      console.log('📦 Sample missions:', missions.rows);
    }
    
    // Check if mission_parcels table exists
    const parcelsTableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'mission_parcels'
      );
    `);
    
    console.log('📋 mission_parcels table exists:', parcelsTableCheck.rows[0].exists);
    
    if (parcelsTableCheck.rows[0].exists) {
      const parcelsCount = await db.query('SELECT COUNT(*) FROM mission_parcels');
      console.log('📦 Number of mission parcels:', parcelsCount.rows[0].count);
    }
    
    // Check users table structure
    const usersTableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log('📋 users table exists:', usersTableCheck.rows[0].exists);
    
    if (usersTableCheck.rows[0].exists) {
      // Check the actual columns in users table
      const columnsCheck = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);
      console.log('📋 users table columns:', columnsCheck.rows);
      
      const usersCount = await db.query('SELECT COUNT(*) FROM users');
      console.log('👥 Number of users:', usersCount.rows[0].count);
      
      const users = await db.query('SELECT id, first_name, last_name, email FROM users LIMIT 5');
      console.log('👥 Sample users:', users.rows);
      
      // Check if there's a role column or similar
      const hasRole = columnsCheck.rows.some(col => col.column_name === 'role');
      const hasUserType = columnsCheck.rows.some(col => col.column_name === 'user_type');
      const hasType = columnsCheck.rows.some(col => col.column_name === 'type');
      
      console.log('🔍 Role-related columns found:');
      console.log('  - role:', hasRole);
      console.log('  - user_type:', hasUserType);
      console.log('  - type:', hasType);
      
      if (hasRole) {
        const driversCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'Livreurs'");
        console.log('🚚 Number of drivers (role):', driversCount.rows[0].count);
      } else if (hasUserType) {
        const driversCount = await db.query("SELECT COUNT(*) FROM users WHERE user_type = 'Livreurs'");
        console.log('🚚 Number of drivers (user_type):', driversCount.rows[0].count);
      } else if (hasType) {
        const driversCount = await db.query("SELECT COUNT(*) FROM users WHERE type = 'Livreurs'");
        console.log('🚚 Number of drivers (type):', driversCount.rows[0].count);
      } else {
        console.log('⚠️ No role column found, checking all users as potential drivers');
        const allUsers = await db.query('SELECT id, first_name, last_name, email FROM users LIMIT 10');
        console.log('👥 All users (potential drivers):', allUsers.rows);
      }
    }
    
    // Check if shippers table exists
    const shippersTableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'shippers'
      );
    `);
    
    console.log('📋 shippers table exists:', shippersTableCheck.rows[0].exists);
    
    if (shippersTableCheck.rows[0].exists) {
      const shippersCount = await db.query('SELECT COUNT(*) FROM shippers');
      console.log('📦 Number of shippers:', shippersCount.rows[0].count);
      
      const shippers = await db.query('SELECT id, name, email FROM shippers LIMIT 5');
      console.log('📦 Sample shippers:', shippers.rows);
    }
    
    // Check if parcels table exists
    const parcelsTableCheck2 = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'parcels'
      );
    `);
    
    console.log('📋 parcels table exists:', parcelsTableCheck2.rows[0].exists);
    
    if (parcelsTableCheck2.rows[0].exists) {
      const parcelsCount = await db.query('SELECT COUNT(*) FROM parcels');
      console.log('📦 Number of parcels:', parcelsCount.rows[0].count);
      
      const parcels = await db.query('SELECT id, tracking_number, shipper_id, status FROM parcels LIMIT 5');
      console.log('📦 Sample parcels:', parcels.rows);
    }
    
    // Check if drivers table exists
    const driversTableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'drivers'
      );
    `);
    
    console.log('📋 drivers table exists:', driversTableCheck.rows[0].exists);
    
    if (driversTableCheck.rows[0].exists) {
      const driversCount = await db.query('SELECT COUNT(*) FROM drivers');
      console.log('🚚 Number of drivers:', driversCount.rows[0].count);
      
      const drivers = await db.query('SELECT id, name, email, car_number, agency FROM drivers LIMIT 5');
      console.log('🚚 Sample drivers:', drivers.rows);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    process.exit(0);
  }
}

checkPickupTables(); 