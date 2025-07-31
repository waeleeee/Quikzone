const db = require('../config/database');

const testShipperCreation = async () => {
  try {
    console.log('🧪 Testing shipper creation...');

    // Check the current table structure
    const columnsResult = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'shippers' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Shippers table structure:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default}`);
    });

    // Try to create a test shipper with minimal data
    const testData = {
      code: 'EXP999',
      password: 'test123',
      name: 'Test Shipper',
      email: 'test@example.com',
      phone: '+216 123 456 789',
      agency: 'Tunis',
      delivery_fees: 0,
      return_fees: 0,
      status: 'Actif',
      identity_number: 'ID999',
      company_name: 'Test Company',
      fiscal_number: 'FISC999',
      company_address: 'Test Address',
      company_governorate: 'Tunis'
    };

    console.log('🚀 Attempting to create test shipper...');
    
    const result = await db.query(`
      INSERT INTO shippers (
        code, password, name, email, phone, agency,
        delivery_fees, return_fees, status, identity_number, 
        company_name, fiscal_number, company_address, company_governorate,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW()
      ) RETURNING *
    `, [
      testData.code, testData.password, testData.name, testData.email, testData.phone, testData.agency,
      testData.delivery_fees, testData.return_fees, testData.status, testData.identity_number,
      testData.company_name, testData.fiscal_number, testData.company_address, testData.company_governorate
    ]);

    console.log('✅ Test shipper created successfully:', result.rows[0]);

    // Clean up - delete the test shipper
    await db.query('DELETE FROM shippers WHERE code = $1', [testData.code]);
    console.log('🧹 Test shipper cleaned up');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test shipper:', error);
    console.error('Error details:', error.detail);
    console.error('Error hint:', error.hint);
    process.exit(1);
  }
};

testShipperCreation(); 