const db = require('./config/database');

const checkUsersTableStructure = async () => {
  try {
    console.log('🔍 Checking users table structure...\n');

    // Get table structure
    const structureResult = await db.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('📋 Users table structure:');
    console.log('-' .repeat(80));
    structureResult.rows.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${column.column_default ? `default: ${column.column_default}` : ''}`);
    });

    // Check if there's a separate passwords table
    console.log('\n📋 Checking for passwords table...');
    const passwordsTableResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%password%'
    `);

    if (passwordsTableResult.rows.length > 0) {
      console.log('📋 Found password-related tables:');
      passwordsTableResult.rows.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    } else {
      console.log('❌ No password-related tables found');
    }

    // Check user data
    console.log('\n📋 Sample user data:');
    console.log('-' .repeat(50));
    
    const userResult = await db.query(`
      SELECT * FROM users 
      WHERE email = 'bensalah@quickzone.tn'
      LIMIT 1
    `);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log('✅ User data for bensalah@quickzone.tn:');
      Object.keys(user).forEach(key => {
        console.log(`  - ${key}: ${user[key]}`);
      });
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error checking users table structure:', error);
  } finally {
    process.exit(0);
  }
};

checkUsersTableStructure(); 