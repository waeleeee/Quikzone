const db = require('../config/database');
async function listManagers() {
  try {
    const result = await db.query('SELECT id, name FROM agency_managers ORDER BY id');
    console.log('Agency managers:');
    result.rows.forEach(row => console.log(`ID: ${row.id}, Name: ${row.name}`));
    process.exit(0);
  } catch (error) {
    console.error('Error listing agency managers:', error);
    process.exit(1);
  }
}
listManagers(); 