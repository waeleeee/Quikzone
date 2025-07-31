const db = require('./config/database');

const checkAllRitejParcels = async () => {
  try {
    console.log('🔍 Checking ALL parcels for Ritej Chaieb...\n');
    
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
    
    // Check parcels table
    const parcelsResult = await db.query(`
      SELECT COUNT(*) as count
      FROM parcels 
      WHERE shipper_id = $1
    `, [expediteur.id]);
    
    console.log(`\n📦 Parcels table: ${parcelsResult.rows[0].count} parcels`);
    
    // Check if there are any other tables with parcel data
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%parcel%' OR table_name LIKE '%colis%'
    `);
    
    console.log('\n📋 Tables that might contain parcel data:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check delivery_missions table
    const deliveryMissionsResult = await db.query(`
      SELECT COUNT(*) as count
      FROM delivery_missions 
      WHERE shipper_id = $1
    `, [expediteur.id]);
    
    console.log(`\n🚚 Delivery missions: ${deliveryMissionsResult.rows[0].count} missions`);
    
    // Check missions_pickup table
    const pickupMissionsResult = await db.query(`
      SELECT COUNT(*) as count
      FROM missions_pickup 
      WHERE shipper_id = $1
    `, [expediteur.id]);
    
    console.log(`\n📥 Pickup missions: ${pickupMissionsResult.rows[0].count} missions`);
    
    // Get all distinct statuses from parcels table
    const allStatusesResult = await db.query(`
      SELECT DISTINCT status 
      FROM parcels 
      WHERE status IS NOT NULL AND status != ''
      ORDER BY status
    `);
    
    console.log('\n📊 All possible statuses in database:');
    allStatusesResult.rows.forEach(row => {
      console.log(`  - ${row.status}`);
    });
    
    // Get status counts for Ritej
    const statusCountsResult = await db.query(`
      SELECT status, COUNT(*) as count
      FROM parcels 
      WHERE shipper_id = $1
      GROUP BY status
      ORDER BY status
    `, [expediteur.id]);
    
    console.log('\n📈 Status counts for Ritej:');
    statusCountsResult.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

checkAllRitejParcels(); 