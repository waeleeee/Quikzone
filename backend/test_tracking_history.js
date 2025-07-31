const { pool } = require('./config/database');

async function testTrackingHistory() {
  try {
    console.log('🔍 TESTING TRACKING HISTORY FOR C-219017\n');
    
    const query = `
      SELECT 
        pth.id,
        p.tracking_number,
        pth.status,
        pth.created_at,
        pth.notes
      FROM parcel_tracking_history pth
      JOIN parcels p ON pth.parcel_id = p.id
      WHERE p.tracking_number = 'C-219017'
      ORDER BY pth.created_at ASC
    `;
    
    const result = await pool.query(query);
    
    console.log('📊 Tracking history for C-219017:');
    console.log('=====================================');
    
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`Status: ${row.status}`);
        console.log(`Time: ${new Date(row.created_at).toLocaleString('fr-FR')}`);
        console.log(`Notes: ${row.notes}`);
        console.log('---');
      });
    } else {
      console.log('No tracking history found for C-219017');
    }
    
    console.log('\n✅ TEST COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error testing tracking history:', error.message);
  } finally {
    await pool.end();
  }
}

testTrackingHistory(); 