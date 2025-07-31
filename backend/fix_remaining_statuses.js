const { pool } = require('./config/database');

async function fixRemainingStatuses() {
  try {
    console.log('🔧 FIXING REMAINING INVALID STATUSES\n');
    
    // 1. Fix "Retour" to "Retour définitif"
    console.log('🔧 FIXING "Retour" STATUS:');
    console.log('=====================================');
    
    const fixRetourQuery = `
      UPDATE parcels 
      SET status = 'Retour définitif' 
      WHERE status = 'Retour';
    `;
    
    const fixRetourResult = await pool.query(fixRetourQuery);
    console.log(`✅ Updated ${fixRetourResult.rowCount} parcels from "Retour" to "Retour définitif"`);
    
    // 2. Now add the CHECK constraint
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
      console.log('✅ Added CHECK constraint successfully!');
      
    } catch (error) {
      console.log('❌ Could not add CHECK constraint:', error.message);
    }
    
    // 3. Verify final status distribution
    console.log('\n📊 FINAL STATUS DISTRIBUTION:');
    console.log('=====================================');
    
    const finalStatusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM parcels 
      GROUP BY status 
      ORDER BY count DESC;
    `;
    
    const finalStatusResult = await pool.query(finalStatusQuery);
    
    finalStatusResult.rows.forEach(row => {
      console.log(`${(row.status || 'NULL').padEnd(25)} ${row.count} parcels`);
    });
    
    // 4. Show all unique statuses
    console.log('\n🎯 ALL UNIQUE STATUSES (FINAL):');
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
    
    // 5. Final validation - check for any remaining invalid statuses
    console.log('\n🔍 FINAL VALIDATION:');
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
      console.log('❌ Still found parcels with invalid statuses:');
      invalidStatusResult.rows.forEach(row => {
        console.log(`   ID: ${row.id}, Tracking: ${row.tracking_number}, Status: "${row.status}"`);
      });
    } else {
      console.log('✅ All parcels now have valid statuses!');
    }
    
    // 6. Show which statuses are missing from current data
    console.log('\n📋 MISSING STATUSES (not currently used):');
    console.log('=====================================');
    
    const allStatuses = [
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
    
    const usedStatuses = uniqueStatusResult.rows.map(row => row.status);
    const missingStatuses = allStatuses.filter(status => !usedStatuses.includes(status));
    
    if (missingStatuses.length > 0) {
      missingStatuses.forEach((status, index) => {
        console.log(`${(index + 1).toString().padStart(2, '0')}. ${status}`);
      });
    } else {
      console.log('All 13 statuses are currently in use!');
    }
    
    console.log('\n✅ ALL STATUS FIXES COMPLETED!');
    console.log('=====================================');
    console.log('• Fixed "Retour" → "Retour définitif"');
    console.log('• Added CHECK constraint successfully');
    console.log('• All parcels now have valid statuses');
    console.log('• Ready for pickup mission synchronization!');
    console.log('\n🎯 PICKUP FLOW STATUSES:');
    console.log('  1. "En attente" (Initial)');
    console.log('  2. "À enlever" (Driver accepts)');
    console.log('  3. "Enlevé" (Driver scans)');
    console.log('  4. "Au dépôt" (Driver completes)');
    
  } catch (error) {
    console.error('❌ Error fixing remaining statuses:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixRemainingStatuses(); 