const db = require('../config/database');

const fixAgencyManagersData = async () => {
  try {
    console.log('🔧 Fixing agency managers data...');
    
    // Update incomplete records with proper data
    const updates = [
      {
        id: 1,
        name: 'Admin QuickZone',
        email: 'admin@quickzone.tn',
        phone: '+216 71 123 456',
        governorate: 'Tunis',
        address: 'Siège Social, Tunis',
        agency: 'Siège'
      },
      {
        id: 2,
        name: 'Marie Dupont',
        email: 'marie@quickzone.tn',
        phone: '+216 71 234 567',
        governorate: 'Tunis',
        address: 'Rue de la Paix, Tunis',
        agency: 'Tunis'
      },
      {
        id: 7,
        name: 'François Petit',
        email: 'francois@quickzone.tn',
        phone: '+216 71 345 678',
        governorate: 'Sousse',
        address: 'Avenue Habib Bourguiba, Sousse',
        agency: 'Sousse'
      },
      {
        id: 8,
        name: 'Nathalie Moreau',
        email: 'nathalie@quickzone.tn',
        phone: '+216 71 456 789',
        governorate: 'Sfax',
        address: 'Boulevard de la République, Sfax',
        agency: 'Sfax'
      },
      {
        id: 28,
        name: 'Wael Admin',
        email: 'wael_admin@quickzone.tn',
        phone: '+216 71 567 890',
        governorate: 'Tunis',
        address: 'Rue de Carthage, Tunis',
        agency: 'Siège'
      }
    ];

    for (const update of updates) {
      await db.query(`
        UPDATE agency_managers 
        SET phone = $1, governorate = $2, address = $3, agency = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [update.phone, update.governorate, update.address, update.agency, update.id]);
      
      console.log(`✅ Updated agency manager: ${update.name}`);
    }

    console.log('✅ Agency managers data fixed successfully');
    
    // Show the updated data
    const result = await db.query(`
      SELECT id, name, email, phone, governorate, address, agency 
      FROM agency_managers 
      ORDER BY id
    `);
    
    console.log('\n📋 Updated agency managers:');
    result.rows.forEach(row => {
      console.log(`${row.id}. ${row.name} - ${row.email} - ${row.phone || 'N/A'} - ${row.governorate || 'N/A'} - ${row.agency || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error fixing agency managers data:', error);
  } finally {
    process.exit(0);
  }
};

fixAgencyManagersData(); 