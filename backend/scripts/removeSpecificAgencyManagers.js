const db = require('../config/database');

const removeSpecificAgencyManagers = async () => {
  try {
    console.log('🗑️ Removing specific agency managers...');
    
    // IDs to remove
    const idsToRemove = [28, 8, 7, 2];
    
    for (const id of idsToRemove) {
      // Check if the agency manager exists
      const checkResult = await db.query('SELECT name FROM agency_managers WHERE id = $1', [id]);
      
      if (checkResult.rows.length > 0) {
        const name = checkResult.rows[0].name;
        
        // Check if referenced in sectors
        const referenced = await db.query('SELECT id FROM sectors WHERE manager_id = $1', [id]);
        if (referenced.rows.length > 0) {
          console.log(`⚠️ Cannot delete ${name} (ID: ${id}) - referenced in sectors`);
          continue;
        }
        
        // Delete the agency manager
        await db.query('DELETE FROM agency_managers WHERE id = $1', [id]);
        console.log(`✅ Deleted agency manager: ${name} (ID: ${id})`);
      } else {
        console.log(`⚠️ Agency manager with ID ${id} not found`);
      }
    }

    console.log('✅ Specific agency managers removal completed');
    
    // Show the remaining data
    const result = await db.query(`
      SELECT id, name, email, phone, governorate, address, agency 
      FROM agency_managers 
      ORDER BY id
    `);
    
    console.log('\n📋 Remaining agency managers:');
    result.rows.forEach(row => {
      console.log(`${row.id}. ${row.name} - ${row.email} - ${row.phone || 'N/A'} - ${row.governorate || 'N/A'} - ${row.agency || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error removing agency managers:', error);
  } finally {
    process.exit(0);
  }
};

removeSpecificAgencyManagers(); 