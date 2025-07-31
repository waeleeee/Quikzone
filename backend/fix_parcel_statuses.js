const { pool } = require('./config/database');

async function fixParcelStatuses() {
  try {
    console.log('🔧 FIXING PARCEL STATUSES - STANDARDIZING AND ADDING MISSING ONES\n');
    
    // 1. First, let's see what we have currently
    console.log('📊 CURRENT STATUS DISTRIBUTION:');
    console.log('=====================================');
    
    const currentStatusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM parcels 
      GROUP BY status 
      ORDER BY count DESC;
    `;
    
    const currentStatusResult = await pool.query(currentStatusQuery);
    
    currentStatusResult.rows.forEach(row => {
      console.log(`${(row.status || 'NULL').padEnd(25)} ${row.count} parcels`);
    });
    
    console.log('\n');
    
    // 2. Define the complete list of 13 statuses (French format)
    const completeStatuses = [
      "En attente",
      "À enlever", 
      "Enlevé",
      "Au dépôt",
      "En cours",
      "RTN dépot",
      "Livrés",
      "Livrés payés",
      "Retour définitif",
      "RTN client agence",
      "Retour Expéditeur",
      "Retour En Cours d'expédition",
      "Retour reçu"
    ];
    
    console.log('🎯 COMPLETE LIST OF 13 STATUSES:');
    console.log('=====================================');
    completeStatuses.forEach((status, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${status}`);
    });
    
    console.log('\n');
    
    // 3. Fix duplicate "Au dépôt" vs "au_depot"
    console.log('🔧 FIXING DUPLICATE STATUSES:');
    console.log('=====================================');
    
    // Update "au_depot" to "Au dépôt"
    const fixDuplicateQuery = `
      UPDATE parcels 
      SET status = 'Au dépôt' 
      WHERE status = 'au_depot';
    `;
    
    const fixDuplicateResult = await pool.query(fixDuplicateQuery);
    console.log(`✅ Updated ${fixDuplicateResult.rowCount} parcels from "au_depot" to "Au dépôt"`);
    
    // 4. Add CHECK constraint to prevent future inconsistencies
    console.log('\n🔒 ADDING CHECK CONSTRAINT:');
    console.log('=====================================');
    
    try {
      // First, drop any existing constraint
      const dropConstraintQuery = `
        ALTER TABLE parcels 
        DROP CONSTRAINT IF EXISTS parcels_status_check;
      `;
      await pool.query(dropConstraintQuery);
      
      // Add new constraint with all 13 statuses
      const addConstraintQuery = `
        ALTER TABLE parcels 
        ADD CONSTRAINT parcels_status_check 
        CHECK (status IN (
          'En attente',
          'À enlever',
          'Enlevé', 
          'Au dépôt',
          'En cours',
          'RTN dépot',
          'Livrés',
          'Livrés payés',
          'Retour définitif',
          'RTN client agence',
          'Retour Expéditeur',
          'Retour En Cours d''expédition',
          'Retour reçu'
        ));
      `;
      
      await pool.query(addConstraintQuery);
      console.log('✅ Added CHECK constraint to prevent invalid statuses');
      
    } catch (error) {
      console.log('⚠️ Could not add CHECK constraint:', error.message);
    }
    
    // 5. Verify the fixes
    console.log('\n📊 UPDATED STATUS DISTRIBUTION:');
    console.log('=====================================');
    
    const updatedStatusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM parcels 
      GROUP BY status 
      ORDER BY count DESC;
    `;
    
    const updatedStatusResult = await pool.query(updatedStatusQuery);
    
    updatedStatusResult.rows.forEach(row => {
      console.log(`${(row.status || 'NULL').padEnd(25)} ${row.count} parcels`);
    });
    
    // 6. Show all unique statuses now
    console.log('\n🎯 ALL UNIQUE STATUSES AFTER FIX:');
    console.log('=====================================');
    
    const uniqueStatusQuery = `
      SELECT DISTINCT status 
      FROM parcels 
      WHERE status IS NOT NULL 
      ORDER BY status;
    `;
    
    const uniqueStatusResult = await pool.query(uniqueStatusQuery);
    
    uniqueStatusResult.rows.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(2, '0')}. ${row.status}`);
    });
    
    // 7. Check if any parcels have invalid statuses
    console.log('\n🔍 CHECKING FOR INVALID STATUSES:');
    console.log('=====================================');
    
    const invalidStatusQuery = `
      SELECT 
        id,
        tracking_number,
        status
      FROM parcels 
      WHERE status NOT IN (
        'En attente',
        'À enlever',
        'Enlevé', 
        'Au dépôt',
        'En cours',
        'RTN dépot',
        'Livrés',
        'Livrés payés',
        'Retour définitif',
        'RTN client agence',
        'Retour Expéditeur',
        'Retour En Cours d''expédition',
        'Retour reçu'
      ) OR status IS NULL;
    `;
    
    const invalidStatusResult = await pool.query(invalidStatusQuery);
    
    if (invalidStatusResult.rows.length > 0) {
      console.log('⚠️ Found parcels with invalid statuses:');
      invalidStatusResult.rows.forEach(row => {
        console.log(`   ID: ${row.id}, Tracking: ${row.tracking_number}, Status: "${row.status}"`);
      });
    } else {
      console.log('✅ All parcels have valid statuses!');
    }
    
    console.log('\n✅ PARCEL STATUS FIX COMPLETED!');
    console.log('=====================================');
    console.log('• Fixed duplicate "au_depot" → "Au dépôt"');
    console.log('• Added CHECK constraint to prevent future inconsistencies');
    console.log('• All 13 statuses are now properly defined');
    console.log('• Ready for pickup mission synchronization!');
    
  } catch (error) {
    console.error('❌ Error fixing parcel statuses:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixParcelStatuses(); 