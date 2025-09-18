const db = require('./config/database');

const debugDemandsFiltering = async () => {
  try {
    console.log('🔍 Debugging demands filtering for Chef d\'agence...\n');

    const userEmail = 'bensalah@quickzone.tn'; // The Chef d'agence from the image
    
    console.log('📋 Checking user data for:', userEmail);
    console.log('-' .repeat(50));
    
    // Check the user data
    const userResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        r.name as role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
    `, [userEmail]);
    
    if (userResult.rows.length > 0) {
      console.log('✅ User found:', userResult.rows[0]);
    } else {
      console.log('❌ User not found');
      return;
    }

    // Check agency managers table for this user
    console.log('\n📋 Checking agency managers table...');
    console.log('-' .repeat(50));
    
    const agencyManagerResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        r.name as role,
        am.agency,
        am.governorate
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN agency_managers am ON u.email = am.email
      WHERE u.email = $1
    `, [userEmail]);
    
    if (agencyManagerResult.rows.length > 0) {
      const user = agencyManagerResult.rows[0];
      console.log('✅ Agency manager data:', user);
      console.log('📍 User governorate:', user.governorate);
      console.log('🏢 User agency:', user.agency);
    } else {
      console.log('❌ No agency manager data found');
    }

    // Check demands table structure
    console.log('\n📋 Checking demands table structure...');
    console.log('-' .repeat(50));
    
    const tableStructureResult = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'demands'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Demands table columns:');
    tableStructureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Check all demands
    console.log('\n📋 Checking all demands...');
    console.log('-' .repeat(50));
    
    const allDemandsResult = await db.query(`
      SELECT 
        d.id,
        d.expediteur_email,
        d.expediteur_name,
        d.expediteur_agency,
        d.status,
        d.created_at
      FROM demands d
      ORDER BY d.created_at DESC
      LIMIT 10
    `);
    
    console.log('📋 Sample demands:');
    allDemandsResult.rows.forEach(demand => {
      console.log(`  - ID: ${demand.id}, Expéditeur: ${demand.expediteur_name} (${demand.expediteur_email}), Agency: ${demand.expediteur_agency}, Status: ${demand.status}`);
    });

    // Check shippers table to understand the relationship
    console.log('\n📋 Checking shippers table...');
    console.log('-' .repeat(50));
    
    const shippersResult = await db.query(`
      SELECT 
        s.id,
        s.name,
        s.email,
        s.agency,
        s.governorate
      FROM shippers s
      ORDER BY s.name
      LIMIT 10
    `);
    
    console.log('📋 Sample shippers:');
    shippersResult.rows.forEach(shipper => {
      console.log(`  - ID: ${shipper.id}, Name: ${shipper.name}, Email: ${shipper.email}, Agency: ${shipper.agency}, Governorate: ${shipper.governorate}`);
    });

    // Test the filtering logic
    console.log('\n📋 Testing filtering logic...');
    console.log('-' .repeat(50));
    
    if (agencyManagerResult.rows.length > 0) {
      const user = agencyManagerResult.rows[0];
      const userAgency = user.agency;
      const userGovernorate = user.governorate;
      
      console.log('🔍 User agency:', userAgency);
      console.log('🔍 User governorate:', userGovernorate);
      
      // Test filtering by expediteur_agency
      if (userAgency) {
        const filteredDemandsResult = await db.query(`
          SELECT 
            d.id,
            d.expediteur_email,
            d.expediteur_name,
            d.expediteur_agency,
            d.status,
            d.created_at
          FROM demands d
          WHERE d.expediteur_agency = $1
          ORDER BY d.created_at DESC
        `, [userAgency]);
        
        console.log(`✅ Demands filtered by agency "${userAgency}": ${filteredDemandsResult.rows.length} demands`);
        filteredDemandsResult.rows.forEach(demand => {
          console.log(`  - ID: ${demand.id}, Expéditeur: ${demand.expediteur_name}, Agency: ${demand.expediteur_agency}, Status: ${demand.status}`);
        });
      }
      
      // Test filtering by governorate (alternative approach)
      if (userGovernorate) {
        const governorateFilteredResult = await db.query(`
          SELECT 
            d.id,
            d.expediteur_email,
            d.expediteur_name,
            d.expediteur_agency,
            d.status,
            d.created_at
          FROM demands d
          WHERE d.expediteur_agency LIKE $1
          ORDER BY d.created_at DESC
        `, [`%${userGovernorate}%`]);
        
        console.log(`✅ Demands filtered by governorate "${userGovernorate}": ${governorateFilteredResult.rows.length} demands`);
        governorateFilteredResult.rows.forEach(demand => {
          console.log(`  - ID: ${demand.id}, Expéditeur: ${demand.expediteur_name}, Agency: ${demand.expediteur_agency}, Status: ${demand.status}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error debugging demands filtering:', error);
  } finally {
    process.exit(0);
  }
};

debugDemandsFiltering(); 