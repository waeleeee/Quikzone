const db = require('./config/database');

const getAllStatuses = async () => {
  try {
    console.log('🔍 Getting all possible statuses from database...\n');
    
    // Get all distinct statuses from parcels table
    const allStatusesResult = await db.query(`
      SELECT DISTINCT status 
      FROM parcels 
      WHERE status IS NOT NULL AND status != ''
      ORDER BY status
    `);
    
    console.log('📊 All possible statuses in database:');
    allStatusesResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.status}`);
    });
    
    // Also check if there are any predefined statuses in the system
    const predefinedStatuses = [
      'En attente',
      'À enlever', 
      'Enlevé',
      'Au dépôt',
      'En cours',
      'RTN dépôt',
      'Livrés',
      'Livrés payés',
      'Retour définitif',
      'RTN client agence',
      'Retour Expéditeur',
      'Retour En Cours',
      'Retour reçu'
    ];
    
    console.log('\n📋 Predefined statuses that should be included:');
    predefinedStatuses.forEach((status, index) => {
      console.log(`  ${index + 1}. ${status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

getAllStatuses(); 