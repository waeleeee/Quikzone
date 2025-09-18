const db = require('./config/database');

const showShippersTable = async () => {
  try {
    console.log('🔍 Showing shippers table structure and data...\n');

    // Get table structure
    console.log('📋 Shippers table structure:');
    console.log('-' .repeat(50));
    
    const structureResult = await db.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'shippers'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table columns:');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${col.column_default ? `[default: ${col.column_default}]` : ''}`);
    });

    // Get all shippers data
    console.log('\n📋 All shippers data:');
    console.log('-' .repeat(50));
    
    const allShippersResult = await db.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        agency,
        governorate,
        address,
        default_warehouse_id,
        commercial_id,
        delivery_fees,
        return_fees,
        status,
        created_at,
        updated_at
      FROM shippers
      ORDER BY created_at DESC
    `);
    
    console.log(`📋 Total shippers: ${allShippersResult.rows.length}`);
    
    if (allShippersResult.rows.length > 0) {
      console.log('📋 Shippers list:');
      allShippersResult.rows.forEach(shipper => {
        console.log(`\n  🔹 ID: ${shipper.id}`);
        console.log(`     Name: ${shipper.name}`);
        console.log(`     Email: ${shipper.email}`);
        console.log(`     Phone: ${shipper.phone || 'Not provided'}`);
        console.log(`     Agency: ${shipper.agency || 'NULL'}`);
        console.log(`     Governorate: ${shipper.governorate || 'NULL'}`);
        console.log(`     Address: ${shipper.address || 'Not provided'}`);
        console.log(`     Default Warehouse ID: ${shipper.default_warehouse_id || 'Not assigned'}`);
        console.log(`     Commercial ID: ${shipper.commercial_id || 'Not assigned'}`);
        console.log(`     Delivery Fees: ${shipper.delivery_fees || 'Not set'}`);
        console.log(`     Return Fees: ${shipper.return_fees || 'Not set'}`);
        console.log(`     Status: ${shipper.status || 'Not set'}`);
        console.log(`     Created: ${shipper.created_at}`);
        console.log(`     Updated: ${shipper.updated_at}`);
      });
    } else {
      console.log('❌ No shippers found in the table');
    }

    // Get agency statistics
    console.log('\n📋 Agency statistics:');
    console.log('-' .repeat(50));
    
    const agencyStatsResult = await db.query(`
      SELECT 
        agency,
        COUNT(*) as shipper_count
      FROM shippers
      WHERE agency IS NOT NULL
      GROUP BY agency
      ORDER BY shipper_count DESC
    `);
    
    console.log('📋 Shippers by agency:');
    agencyStatsResult.rows.forEach(stat => {
      console.log(`  - ${stat.agency}: ${stat.shipper_count} shippers`);
    });

    // Get governorate statistics
    console.log('\n📋 Governorate statistics:');
    console.log('-' .repeat(50));
    
    const governorateStatsResult = await db.query(`
      SELECT 
        governorate,
        COUNT(*) as shipper_count
      FROM shippers
      WHERE governorate IS NOT NULL
      GROUP BY governorate
      ORDER BY shipper_count DESC
    `);
    
    console.log('📋 Shippers by governorate:');
    governorateStatsResult.rows.forEach(stat => {
      console.log(`  - ${stat.governorate}: ${stat.shipper_count} shippers`);
    });

    // Check for shippers without agency
    console.log('\n📋 Shippers without agency:');
    console.log('-' .repeat(50));
    
    const noAgencyResult = await db.query(`
      SELECT id, name, email, governorate
      FROM shippers
      WHERE agency IS NULL
      ORDER BY created_at DESC
    `);
    
    if (noAgencyResult.rows.length > 0) {
      console.log(`⚠️ Found ${noAgencyResult.rows.length} shippers without agency:`);
      noAgencyResult.rows.forEach(shipper => {
        console.log(`  - ID: ${shipper.id}, Name: ${shipper.name}, Email: ${shipper.email}, Governorate: ${shipper.governorate || 'NULL'}`);
      });
    } else {
      console.log('✅ All shippers have agency assigned');
    }

    // Check for shippers without governorate
    console.log('\n📋 Shippers without governorate:');
    console.log('-' .repeat(50));
    
    const noGovernorateResult = await db.query(`
      SELECT id, name, email, agency
      FROM shippers
      WHERE governorate IS NULL
      ORDER BY created_at DESC
    `);
    
    if (noGovernorateResult.rows.length > 0) {
      console.log(`⚠️ Found ${noGovernorateResult.rows.length} shippers without governorate:`);
      noGovernorateResult.rows.forEach(shipper => {
        console.log(`  - ID: ${shipper.id}, Name: ${shipper.name}, Email: ${shipper.email}, Agency: ${shipper.agency || 'NULL'}`);
      });
    } else {
      console.log('✅ All shippers have governorate assigned');
    }

  } catch (error) {
    console.error('❌ Error showing shippers table:', error);
  } finally {
    process.exit(0);
  }
};

showShippersTable(); 