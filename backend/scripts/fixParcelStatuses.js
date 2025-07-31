const db = require('../config/database');

const statusMapping = {
  'pending': 'En attente',
  'to_pickup': 'À enlever',
  'picked_up': 'Enlevé',
  'at_warehouse': 'Au dépôt',
  'in_transit': 'En cours',
  'return_to_warehouse': 'RTN dépôt',
  'delivered': 'Livrés',
  'delivered_paid': 'Livrés payés',
  'final_return': 'Retour définitif',
  'return_to_client_agency': 'RTN client agence',
  'return_to_sender': 'Retour Expéditeur',
  'return_in_transit': 'Retour En Cours d\'expédition',
  'return_received': 'Retour reçu'
};

async function fixParcelStatuses() {
  try {
    console.log('🔧 Starting parcel status fix...');
    
    // First, let's see what statuses we have
    const currentStatuses = await db.query('SELECT DISTINCT status FROM parcels WHERE assigned_warehouse_id IS NOT NULL');
    console.log('📊 Current parcel statuses:');
    currentStatuses.rows.forEach(row => console.log(`  - ${row.status}`));
    
    // Update each English status to its French equivalent
    for (const [englishStatus, frenchStatus] of Object.entries(statusMapping)) {
      const result = await db.query(
        'UPDATE parcels SET status = $1 WHERE status = $2 AND assigned_warehouse_id IS NOT NULL',
        [frenchStatus, englishStatus]
      );
      
      if (result.rowCount > 0) {
        console.log(`✅ Updated ${result.rowCount} parcels from '${englishStatus}' to '${frenchStatus}'`);
      }
    }
    
    // Check final statuses
    const finalStatuses = await db.query('SELECT DISTINCT status FROM parcels WHERE assigned_warehouse_id IS NOT NULL');
    console.log('📊 Final parcel statuses:');
    finalStatuses.rows.forEach(row => console.log(`  - ${row.status}`));
    
    console.log('✅ Parcel status fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing parcel statuses:', error);
    process.exit(1);
  }
}

fixParcelStatuses(); 