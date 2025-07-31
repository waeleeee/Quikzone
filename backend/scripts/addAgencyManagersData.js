const db = require('../config/database');

const addAgencyManagersData = async () => {
  try {
    console.log('👥 Adding sample agency managers data...');
    
    // Sample agency managers data
    const agencyManagers = [
      {
        name: 'Amine Gharbi',
        email: 'amine.gharbi@quickzone.tn',
        phone: '+216 20 123 456',
        governorate: 'Tunis',
        address: 'Rue de la République, Tunis',
        agency: 'Tunis'
      },
      {
        name: 'Sonia Ben Salah',
        email: 'sonia.bensalah@quickzone.tn',
        phone: '+216 98 654 321',
        governorate: 'Sousse',
        address: 'Avenue de la Liberté, Sousse',
        agency: 'Sousse'
      },
      {
        name: 'Karim Ben Ali',
        email: 'karim.benali@quickzone.tn',
        phone: '+216 71 234 567',
        governorate: 'Sfax',
        address: 'Boulevard Habib Bourguiba, Sfax',
        agency: 'Sfax'
      },
      {
        name: 'Fatima Mansouri',
        email: 'fatima.mansouri@quickzone.tn',
        phone: '+216 73 345 678',
        governorate: 'Monastir',
        address: 'Rue de la Médina, Monastir',
        agency: 'Monastir'
      }
    ];
    
    // Insert agency managers
    for (const manager of agencyManagers) {
      await db.query(`
        INSERT INTO agency_managers (name, email, phone, governorate, address, agency, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO NOTHING
      `, [
        manager.name,
        manager.email,
        manager.phone,
        manager.governorate,
        manager.address,
        manager.agency,
        new Date('2024-01-15').toISOString()
      ]);
    }
    
    console.log('✅ Added sample agency managers data');
    console.log('🎉 Agency managers data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding agency managers data:', error);
  } finally {
    process.exit(0);
  }
};

addAgencyManagersData(); 