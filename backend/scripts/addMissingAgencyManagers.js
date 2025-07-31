const db = require('../config/database');

const missingManagers = [
  { id: 1, name: 'Admin QuickZone', email: 'admin@quickzone.tn' },
  { id: 2, name: 'Marie Dupont', email: 'marie@quickzone.tn' },
  { id: 7, name: 'François Petit', email: 'francois@quickzone.tn' },
  { id: 8, name: 'Nathalie Moreau', email: 'nathalie@quickzone.tn' },
  { id: 28, name: 'Wael Admin', email: 'wael_admin@quickzone.tn' },
  { id: 31, name: 'Wael Chef Agence', email: 'wael_chef_agence@quickzone.tn' }
];

async function addMissingManagers() {
  try {
    console.log('🔄 Adding missing agency managers...');
    for (const mgr of missingManagers) {
      // Check if already exists
      const exists = await db.query('SELECT id FROM agency_managers WHERE id = $1', [mgr.id]);
      if (exists.rows.length === 0) {
        await db.query(
          'INSERT INTO agency_managers (id, name, email) VALUES ($1, $2, $3)',
          [mgr.id, mgr.name, mgr.email]
        );
        console.log(`✅ Added: ${mgr.name} (ID: ${mgr.id})`);
      } else {
        console.log(`ℹ️ Already exists: ${mgr.name} (ID: ${mgr.id})`);
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding missing agency managers:', error);
    process.exit(1);
  }
}

addMissingManagers(); 