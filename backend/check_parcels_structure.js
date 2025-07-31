const { pool } = require('./config/database');

async function checkParcelsStructure() {
  try {
    console.log('🔍 CHECKING PARCELS TABLE STRUCTURE AND STATUSES\n');
    
    // 1. Get table structure
    console.log('📋 PARCELS TABLE STRUCTURE:');
    console.log('=====================================');
    
    const structureQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'parcels' 
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await pool.query(structureQuery);
    
    structureResult.rows.forEach(row => {
      const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = row.column_default ? `DEFAULT ${row.column_default}` : '';
      const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
      
      console.log(`${row.column_name.padEnd(25)} ${row.data_type}${length} ${nullable} ${defaultVal}`);
    });
    
    console.log('\n');
    
    // 2. Get status constraint details
    console.log('📊 STATUS COLUMN CONSTRAINT:');
    console.log('=====================================');
    
    const constraintQuery = `
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'parcels'::regclass 
      AND contype = 'c';
    `;
    
    const constraintResult = await pool.query(constraintQuery);
    
    constraintResult.rows.forEach(row => {
      console.log(`Constraint: ${row.constraint_name}`);
      console.log(`Definition: ${row.constraint_definition}`);
      console.log('');
    });
    
    // 3. Get all available statuses from the constraint
    console.log('🎯 ALLOWED PARCEL STATUSES:');
    console.log('=====================================');
    
    const statusQuery = `
      SELECT 
        unnest(enum_range(NULL::parcel_status_enum)) as status_code
      ORDER BY status_code;
    `;
    
    try {
      const statusResult = await pool.query(statusQuery);
      statusResult.rows.forEach((row, index) => {
        console.log(`${(index + 1).toString().padStart(2, '0')}. ${row.status_code}`);
      });
    } catch (error) {
      // If enum doesn't exist, try to extract from CHECK constraint
      console.log('Trying to extract statuses from CHECK constraint...');
      
      const checkQuery = `
        SELECT 
          pg_get_constraintdef(oid) as constraint_def
        FROM pg_constraint 
        WHERE conrelid = 'parcels'::regclass 
        AND contype = 'c' 
        AND pg_get_constraintdef(oid) LIKE '%status%';
      `;
      
      const checkResult = await pool.query(checkQuery);
      if (checkResult.rows.length > 0) {
        const constraintDef = checkResult.rows[0].constraint_def;
        console.log('Status constraint found:');
        console.log(constraintDef);
        
        // Extract statuses from the constraint
        const statusMatch = constraintDef.match(/IN \(([^)]+)\)/);
        if (statusMatch) {
          const statuses = statusMatch[1].split(',').map(s => s.trim().replace(/'/g, ''));
          console.log('\nExtracted statuses:');
          statuses.forEach((status, index) => {
            console.log(`${(index + 1).toString().padStart(2, '0')}. ${status}`);
          });
        }
      }
    }
    
    console.log('\n');
    
    // 4. Get sample data to see current statuses (using correct column names)
    console.log('📦 SAMPLE PARCELS WITH THEIR STATUSES:');
    console.log('=====================================');
    
    const sampleQuery = `
      SELECT 
        id,
        tracking_number,
        status,
        destination,
        recipient_name,
        created_at
      FROM parcels 
      ORDER BY created_at DESC 
      LIMIT 10;
    `;
    
    const sampleResult = await pool.query(sampleQuery);
    
    if (sampleResult.rows.length > 0) {
      console.log('ID'.padEnd(5) + 'Tracking'.padEnd(15) + 'Status'.padEnd(20) + 'Destination'.padEnd(25) + 'Recipient'.padEnd(20) + 'Created');
      console.log('-'.repeat(105));
      
      sampleResult.rows.forEach(row => {
        console.log(
          row.id.toString().padEnd(5) + 
          row.tracking_number.padEnd(15) + 
          (row.status || '').padEnd(20) + 
          (row.destination || '').substring(0, 23).padEnd(25) + 
          (row.recipient_name || '').substring(0, 18).padEnd(20) + 
          new Date(row.created_at).toLocaleDateString()
        );
      });
    } else {
      console.log('No parcels found in the database.');
    }
    
    console.log('\n');
    
    // 5. Get status distribution
    console.log('📊 STATUS DISTRIBUTION:');
    console.log('=====================================');
    
    const distributionQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM parcels 
      GROUP BY status 
      ORDER BY count DESC;
    `;
    
    const distributionResult = await pool.query(distributionQuery);
    
    if (distributionResult.rows.length > 0) {
      console.log('Status'.padEnd(25) + 'Count');
      console.log('-'.repeat(35));
      
      distributionResult.rows.forEach(row => {
        console.log((row.status || 'NULL').padEnd(25) + row.count.toString());
      });
    }
    
    console.log('\n');
    
    // 6. Check if parcel_status_definitions table exists
    console.log('📋 PARCEL STATUS DEFINITIONS TABLE:');
    console.log('=====================================');
    
    const definitionsQuery = `
      SELECT 
        status_code,
        status_name,
        status_name_ar,
        description,
        color_code,
        sequence_order
      FROM parcel_status_definitions 
      ORDER BY sequence_order;
    `;
    
    try {
      const definitionsResult = await pool.query(definitionsQuery);
      
      if (definitionsResult.rows.length > 0) {
        console.log('Code'.padEnd(20) + 'French Name'.padEnd(20) + 'Arabic Name'.padEnd(20) + 'Color'.padEnd(10) + 'Order');
        console.log('-'.repeat(80));
        
        definitionsResult.rows.forEach(row => {
          console.log(
            row.status_code.padEnd(20) + 
            (row.status_name || '').padEnd(20) + 
            (row.status_name_ar || '').padEnd(20) + 
            (row.color_code || '').padEnd(10) + 
            row.sequence_order.toString()
          );
        });
      } else {
        console.log('No status definitions found in parcel_status_definitions table.');
      }
    } catch (error) {
      console.log('parcel_status_definitions table does not exist or is not accessible.');
    }
    
    // 7. Get all unique statuses currently in use
    console.log('\n🎯 ALL UNIQUE STATUSES CURRENTLY IN USE:');
    console.log('=====================================');
    
    const uniqueStatusQuery = `
      SELECT DISTINCT status 
      FROM parcels 
      WHERE status IS NOT NULL 
      ORDER BY status;
    `;
    
    const uniqueStatusResult = await pool.query(uniqueStatusQuery);
    
    if (uniqueStatusResult.rows.length > 0) {
      uniqueStatusResult.rows.forEach((row, index) => {
        console.log(`${(index + 1).toString().padStart(2, '0')}. ${row.status}`);
      });
    } else {
      console.log('No statuses found in parcels table.');
    }
    
  } catch (error) {
    console.error('❌ Error checking parcels structure:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the check
checkParcelsStructure(); 