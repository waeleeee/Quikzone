const db = require('../config/database');

const addAgencyMembersData = async () => {
  try {
    console.log('👥 Adding sample agency members data...');
    
    // Sample agency members data
    const agencyMembers = [
      {
        name: 'Pierre Dubois',
        email: 'pierre.membre@email.com',
        phone: '+33 1 23 45 67 89',
        governorate: 'Tunis',
        agency: 'Tunis',
        role: 'Responsable d\'agence',
        status: 'Actif'
      },
      {
        name: 'Sarah Ahmed',
        email: 'sarah.membre@email.com',
        phone: '+33 1 98 76 54 32',
        governorate: 'Sousse',
        agency: 'Sousse',
        role: 'Agent d\'accueil',
        status: 'Actif'
      },
      {
        name: 'Mohamed Ali',
        email: 'mohamed.membre@email.com',
        phone: '+33 1 11 22 33 44',
        governorate: 'Sfax',
        agency: 'Sfax',
        role: 'Gestionnaire de stock',
        status: 'Actif'
      },
      {
        name: 'Fatima Ben Salem',
        email: 'fatima.membre@email.com',
        phone: '+33 1 44 55 66 77',
        governorate: 'Monastir',
        agency: 'Monastir',
        role: 'Agent de livraison',
        status: 'Inactif'
      }
    ];
    
    // Insert agency members
    for (const member of agencyMembers) {
      await db.query(`
        INSERT INTO agency_members (name, email, phone, governorate, agency, role, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO NOTHING
      `, [
        member.name,
        member.email,
        member.phone,
        member.governorate,
        member.agency,
        member.role,
        member.status,
        new Date('2024-01-15').toISOString()
      ]);
    }
    
    console.log('✅ Added sample agency members data');
    console.log('🎉 Agency members data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding agency members data:', error);
  } finally {
    process.exit(0);
  }
};

addAgencyMembersData(); 