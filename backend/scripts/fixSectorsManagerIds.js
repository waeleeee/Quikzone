const db = require('../config/database');

async function fixSectorsManagerIds() {
  try {
    console.log('🔄 Fixing sectors.manager_id values...');
    const result = await db.query(`
      UPDATE sectors
      SET manager_id = NULL
      WHERE manager_id IS NOT NULL
        AND manager_id NOT IN (SELECT id FROM agency_managers)
      RETURNING id, name, manager_id;
    `);
    console.log(`✅ Updated ${result.rows.length} sectors. All manager_id values now reference valid agency_managers or are NULL.`);
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`Sector ID: ${row.id}, Name: ${row.name}, manager_id: ${row.manager_id}`);
      });
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing sectors.manager_id:', error);
    process.exit(1);
  }
}

fixSectorsManagerIds(); 