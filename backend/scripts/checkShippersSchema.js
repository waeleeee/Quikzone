const db = require('../config/database');

const checkShippersSchema = async () => {
  try {
    console.log('🔍 Checking shippers table schema...\n');

    // Check current table structure
    const tableInfo = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'shippers' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 SHIPPERS TABLE COLUMNS:');
    tableInfo.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable === 'YES' ? 'YES' : 'NO'}`);
    });

    // Check sample data
    const sampleData = await db.query('SELECT * FROM shippers LIMIT 1');
    if (sampleData.rows.length > 0) {
      console.log('\n📋 SAMPLE DATA:');
      console.log('Sample record:', sampleData.rows[0]);
    }

    // Check for missing columns that the API expects
    const expectedColumns = [
      'id', 'code', 'password', 'name', 'email', 'phone', 'agency', 'commercial_id',
      'delivery_fees', 'return_fees', 'status', 'identity_number', 'id_document',
      'company_name', 'fiscal_number', 'company_address', 'company_governorate',
      'company_documents', 'created_at', 'updated_at'
    ];

    const existingColumns = tableInfo.rows.map(col => col.column_name);
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('\n❌ MISSING COLUMNS:');
      missingColumns.forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('\n✅ All expected columns are present');
    }

    // Check for data issues
    const dataIssues = await db.query(`
      SELECT id, name, email, 
             CASE WHEN code IS NULL OR code = '' THEN 'Missing code' ELSE 'OK' END as code_status,
             CASE WHEN password IS NULL OR password = '' THEN 'Missing password' ELSE 'OK' END as password_status
      FROM shippers 
      LIMIT 5
    `);

    console.log('\n📋 DATA ISSUES CHECK:');
    dataIssues.rows.forEach(row => {
      console.log(`  ID ${row.id} (${row.name}): Code: ${row.code_status}, Password: ${row.password_status}`);
    });

  } catch (error) {
    console.error('❌ Error checking shippers schema:', error);
  } finally {
    process.exit(0);
  }
};

checkShippersSchema(); 