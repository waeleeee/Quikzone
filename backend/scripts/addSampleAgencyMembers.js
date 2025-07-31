const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waelrh',
});

const sampleAgencyMembers = [
  {
    name: 'Ahmed Ben Ali',
    email: 'ahmed.benali@quickzone.tn',
    phone: '+216 71 123 456',
    governorate: 'Sfax',
    address: '123 Rue de la République, Sfax',
    agency: 'Sfax',
    role: 'Magasinier'
  },
  {
    name: 'Fatma Mansouri',
    email: 'fatma.mansouri@quickzone.tn',
    phone: '+216 71 123 457',
    governorate: 'Sfax',
    address: '456 Avenue Habib Bourguiba, Sfax',
    agency: 'Sfax',
    role: 'Agent Débriefing Livreurs'
  },
  {
    name: 'Mohamed Karray',
    email: 'mohamed.karray@quickzone.tn',
    phone: '+216 71 123 458',
    governorate: 'Sfax',
    address: '789 Rue de la Médina, Sfax',
    agency: 'Sfax',
    role: 'Magasinier de Nuit'
  },
  {
    name: 'Salma Trabelsi',
    email: 'salma.trabelsi@quickzone.tn',
    phone: '+216 71 123 459',
    governorate: 'Sfax',
    address: '321 Boulevard de l\'Environnement, Sfax',
    agency: 'Sfax',
    role: 'Chargé des Opérations Logistiques'
  },
  {
    name: 'Hassan Mejri',
    email: 'hassan.mejri@quickzone.tn',
    phone: '+216 71 123 460',
    governorate: 'Sfax',
    address: '654 Rue de la Plage, Sfax',
    agency: 'Sfax',
    role: 'Sinior OPS Membre'
  },
  {
    name: 'Amina Ben Salem',
    email: 'amina.bensalem@quickzone.tn',
    phone: '+216 71 123 461',
    governorate: 'Tunis',
    address: '123 Avenue Habib Bourguiba, Tunis',
    agency: 'Tunis',
    role: 'Magasinier'
  },
  {
    name: 'Karim Ben Youssef',
    email: 'karim.benyoussef@quickzone.tn',
    phone: '+216 71 123 462',
    governorate: 'Tunis',
    address: '456 Rue de Carthage, Tunis',
    agency: 'Tunis',
    role: 'Agent Débriefing Livreurs'
  },
  {
    name: 'Nour Ben Ammar',
    email: 'nour.benammar@quickzone.tn',
    phone: '+216 71 123 463',
    governorate: 'Sousse',
    address: '123 Boulevard de la Corniche, Sousse',
    agency: 'Sousse',
    role: 'Magasinier'
  },
  {
    name: 'Youssef Ben Hmida',
    email: 'youssef.benhmida@quickzone.tn',
    phone: '+216 71 123 464',
    governorate: 'Sousse',
    address: '456 Rue de la Médina, Sousse',
    agency: 'Sousse',
    role: 'Chargé des Opérations Logistiques'
  }
];

async function addSampleAgencyMembers() {
  try {
    console.log('🔍 Adding sample agency members...');
    
    // Check if agency_members table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'agency_members'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ agency_members table does not exist. Please run the database setup first.');
      return;
    }
    
    // Check if data already exists
    const existingData = await pool.query('SELECT COUNT(*) FROM agency_members');
    const count = parseInt(existingData.rows[0].count);
    
    if (count > 0) {
      console.log(`ℹ️  Agency members table already has ${count} records. Skipping...`);
      return;
    }
    
    // Insert sample data
    for (const member of sampleAgencyMembers) {
      const result = await pool.query(`
        INSERT INTO agency_members (name, email, phone, governorate, address, agency, role, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'Actif', CURRENT_TIMESTAMP)
        RETURNING id, name, email, agency, role
      `, [member.name, member.email, member.phone, member.governorate, member.address, member.agency, member.role]);
      
      console.log(`✅ Added agency member: ${result.rows[0].name} (${result.rows[0].role}) at ${result.rows[0].agency}`);
    }
    
    console.log(`🎉 Successfully added ${sampleAgencyMembers.length} sample agency members!`);
    
    // Show summary by agency
    const summary = await pool.query(`
      SELECT agency, COUNT(*) as count 
      FROM agency_members 
      GROUP BY agency 
      ORDER BY agency
    `);
    
    console.log('\n📊 Summary by agency:');
    summary.rows.forEach(row => {
      console.log(`   ${row.agency}: ${row.count} member(s)`);
    });
    
  } catch (error) {
    console.error('❌ Error adding sample agency members:', error);
  } finally {
    await pool.end();
  }
}

addSampleAgencyMembers(); 