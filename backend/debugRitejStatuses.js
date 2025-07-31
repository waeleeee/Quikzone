const db = require('./config/database');

const debugRitejStatuses = async () => {
  try {
    console.log('🔍 Debugging Ritej Chaieb parcel statuses...\n');
    
    // First, find Ritej's shipper ID
    const expediteurResult = await db.query(`
      SELECT id, name, email
      FROM shippers 
      WHERE email = $1
    `, ['ritejchaieb@icloud.com']);
    
    if (expediteurResult.rows.length === 0) {
      console.log('❌ No expediteur found for email: ritejchaieb@icloud.com');
      return;
    }
    
    const expediteur = expediteurResult.rows[0];
    console.log('📧 Found expediteur:', expediteur);
    
    // Get all parcels with their statuses
    const parcelsResult = await db.query(`
      SELECT id, tracking_number, status, created_at, updated_at
      FROM parcels 
      WHERE shipper_id = $1
      ORDER BY created_at DESC
    `, [expediteur.id]);
    
    console.log(`\n📦 Total parcels found: ${parcelsResult.rows.length}`);
    
    // Group by status
    const statusCounts = {};
    parcelsResult.rows.forEach(parcel => {
      const status = parcel.status || 'NULL';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('\n📊 Status distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Show individual parcels
    console.log('\n📋 Individual parcels:');
    parcelsResult.rows.forEach((parcel, index) => {
      console.log(`  ${index + 1}. ${parcel.tracking_number} - ${parcel.status} (created: ${parcel.created_at})`);
    });
    
    // Check for any NULL or empty statuses
    const nullStatusResult = await db.query(`
      SELECT COUNT(*) as count
      FROM parcels 
      WHERE shipper_id = $1 AND (status IS NULL OR status = '')
    `, [expediteur.id]);
    
    console.log(`\n⚠️  Parcels with NULL/empty status: ${nullStatusResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

debugRitejStatuses(); 