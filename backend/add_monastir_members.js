const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function addMonastirMembers() {
  try {
    console.log('🔍 Adding test members to Monastir agency...');
    
    // Check if Monastir agency exists
    const agencyCheck = await db.query('SELECT id FROM agencies WHERE name = $1', ['Monastir']);
    if (agencyCheck.rows.length === 0) {
      console.log('🏢 Creating Monastir agency...');
      await db.query(`
        INSERT INTO agencies (name, governorate, status)
        VALUES ('Monastir', 'Monastir', 'active')
      `);
      console.log('✅ Monastir agency created');
    } else {
      console.log('✅ Monastir agency already exists');
    }
    
    // Test members for Monastir agency
    const monastirMembers = [
      {
        name: 'Ahmed Monastir',
        email: 'ahmed.monastir@quickzone.tn',
        phone: '+216 73 123 456',
        governorate: 'Monastir',
        agency: 'Monastir',
        role: 'Magasinier',
        status: 'Actif'
      },
      {
        name: 'Fatima Monastir',
        email: 'fatima.monastir@quickzone.tn',
        phone: '+216 73 234 567',
        governorate: 'Monastir',
        agency: 'Monastir',
        role: 'Agent Débriefing Livreurs',
        status: 'Actif'
      },
      {
        name: 'Karim Monastir',
        email: 'karim.monastir@quickzone.tn',
        phone: '+216 73 345 678',
        governorate: 'Monastir',
        agency: 'Monastir',
        role: 'Chargé des Opérations Logistiques',
        status: 'Actif'
      }
    ];
    
    for (const memberData of monastirMembers) {
      // Check if member already exists
      const existingMember = await db.query('SELECT id FROM agency_members WHERE email = $1', [memberData.email]);
      
      if (existingMember.rows.length === 0) {
        console.log(`📝 Adding member: ${memberData.name}`);
        
        // Generate unique username
        let username = memberData.email.split('@')[0];
        let counter = 1;
        let uniqueUsername = username;
        while (true) {
          const existing = await db.query('SELECT id FROM users WHERE username = $1', [uniqueUsername]);
          if (existing.rows.length === 0) break;
          uniqueUsername = username + counter;
          counter++;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // Start transaction
        const client = await db.pool.connect();
        try {
          await client.query('BEGIN');
          
          // Create user account
          const userResult = await client.query(`
            INSERT INTO users (username, email, password_hash, first_name, last_name, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING id
          `, [uniqueUsername, memberData.email, hashedPassword, memberData.name.split(' ')[0], memberData.name.split(' ').slice(1).join(' ') || '']);
          
          const userId = userResult.rows[0].id;
          
          // Assign "Membre de l'agence" role
          const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Membre de l\'agence']);
          if (roleResult.rows.length > 0) {
            await client.query(`
              INSERT INTO user_roles (user_id, role_id)
              VALUES ($1, $2)
            `, [userId, roleResult.rows[0].id]);
          }
          
          // Create agency member
          await client.query(`
            INSERT INTO agency_members (name, email, phone, governorate, address, agency, role, status, password)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, [
            memberData.name, 
            memberData.email, 
            memberData.phone, 
            memberData.governorate, 
            'Monastir Address', 
            memberData.agency, 
            memberData.role, 
            memberData.status, 
            hashedPassword
          ]);
          
          await client.query('COMMIT');
          console.log(`✅ Member ${memberData.name} created successfully`);
          
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Error creating member ${memberData.name}:`, error.message);
        } finally {
          client.release();
        }
      } else {
        console.log(`⚠️ Member ${memberData.name} already exists`);
      }
    }
    
    // Verify the members were created
    const monastirMembersCheck = await db.query(`
      SELECT name, email, agency, role, status 
      FROM agency_members 
      WHERE agency = 'Monastir'
      ORDER BY name
    `);
    
    console.log('\n📊 Monastir Agency Members:');
    console.log('='.repeat(50));
    monastirMembersCheck.rows.forEach(member => {
      console.log(`${member.name} (${member.email}) - ${member.role} - ${member.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

addMonastirMembers(); 