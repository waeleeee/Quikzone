const db = require('../config/database');

const fixShippersData = async () => {
  try {
    console.log('🔧 Fixing shippers data...\n');

    // Get all shippers
    const shippers = await db.query('SELECT * FROM shippers');
    console.log(`Found ${shippers.rows.length} shippers to process`);

    for (const shipper of shippers.rows) {
      console.log(`\nProcessing shipper ID ${shipper.id}: ${shipper.name}`);
      
      // Prepare update data
      const updates = {};
      
      // Fix status field - convert 'active' to 'Actif'
      if (shipper.status === 'active') {
        updates.status = 'Actif';
        console.log(`  - Fixing status: ${shipper.status} → Actif`);
      }
      
      // Ensure required fields have default values
      if (!shipper.delivery_fees || shipper.delivery_fees === '0.00') {
        updates.delivery_fees = 0;
        console.log(`  - Setting delivery_fees to 0`);
      }
      
      if (!shipper.return_fees || shipper.return_fees === '0.00') {
        updates.return_fees = 0;
        console.log(`  - Setting return_fees to 0`);
      }
      
      // Ensure company_name is set if company exists
      if (shipper.company && !shipper.company_name) {
        updates.company_name = shipper.company;
        console.log(`  - Setting company_name: ${shipper.company}`);
      }
      
      // Ensure identity_number has a value if empty
      if (!shipper.identity_number || shipper.identity_number === '') {
        updates.identity_number = `ID${shipper.id}`;
        console.log(`  - Setting identity_number: ID${shipper.id}`);
      }
      
      // Ensure fiscal_number has a value if empty
      if (!shipper.fiscal_number || shipper.fiscal_number === '') {
        updates.fiscal_number = `FISC${shipper.id}`;
        console.log(`  - Setting fiscal_number: FISC${shipper.id}`);
      }
      
      // Ensure company_address has a value if empty
      if (!shipper.company_address || shipper.company_address === '') {
        updates.company_address = 'Adresse par défaut';
        console.log(`  - Setting company_address: Adresse par défaut`);
      }
      
      // Ensure company_governorate has a value if empty
      if (!shipper.company_governorate || shipper.company_governorate === '') {
        updates.company_governorate = shipper.city || 'Tunis';
        console.log(`  - Setting company_governorate: ${shipper.city || 'Tunis'}`);
      }
      
      // Update the shipper if there are changes
      if (Object.keys(updates).length > 0) {
        const updateFields = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`).join(', ');
        const updateValues = Object.values(updates);
        updateValues.push(shipper.id);
        
        const query = `UPDATE shippers SET ${updateFields}, updated_at = NOW() WHERE id = $${updateValues.length}`;
        
        await db.query(query, updateValues);
        console.log(`  ✅ Updated shipper ${shipper.id}`);
      } else {
        console.log(`  ✅ No updates needed for shipper ${shipper.id}`);
      }
    }

    console.log('\n🎉 Shippers data fix completed!');
    
    // Show summary
    const summary = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Actif' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as old_active,
        COUNT(CASE WHEN delivery_fees = 0 THEN 1 END) as zero_delivery_fees,
        COUNT(CASE WHEN return_fees = 0 THEN 1 END) as zero_return_fees
      FROM shippers
    `);
    
    console.log('\n📊 Summary:');
    console.log(`  Total shippers: ${summary.rows[0].total}`);
    console.log(`  Active status: ${summary.rows[0].active}`);
    console.log(`  Old active status: ${summary.rows[0].old_active}`);
    console.log(`  Zero delivery fees: ${summary.rows[0].zero_delivery_fees}`);
    console.log(`  Zero return fees: ${summary.rows[0].zero_return_fees}`);

  } catch (error) {
    console.error('❌ Error fixing shippers data:', error);
  } finally {
    process.exit(0);
  }
};

fixShippersData(); 