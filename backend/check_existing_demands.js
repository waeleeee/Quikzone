const db = require('./config/database');

const checkExistingDemands = async () => {
  try {
    console.log('🔍 Checking existing demands and their agency data...\n');

    // Check all demands
    console.log('📋 All demands in the system:');
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
    `);
    
    console.log(`📋 Total demands found: ${allDemandsResult.rows.length}`);
    
    if (allDemandsResult.rows.length > 0) {
      console.log('📋 Sample demands:');
      allDemandsResult.rows.slice(0, 10).forEach(demand => {
        console.log(`  - ID: ${demand.id}, Expéditeur: ${demand.expediteur_name} (${demand.expediteur_email}), Agency: ${demand.expediteur_agency || 'NULL'}, Status: ${demand.status}`);
      });
    } else {
      console.log('❌ No demands found in the system');
    }

    // Check shippers and their agencies
    console.log('\n📋 Checking shippers and their agencies:');
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
    `);
    
    console.log(`📋 Total shippers found: ${shippersResult.rows.length}`);
    
    if (shippersResult.rows.length > 0) {
      console.log('📋 Sample shippers:');
      shippersResult.rows.slice(0, 10).forEach(shipper => {
        console.log(`  - ID: ${shipper.id}, Name: ${shipper.name}, Email: ${shipper.email}, Agency: ${shipper.agency || 'NULL'}, Governorate: ${shipper.governorate || 'NULL'}`);
      });
    }

    // Check if there are demands without agency data
    console.log('\n📋 Checking demands without agency data:');
    console.log('-' .repeat(50));
    
    const demandsWithoutAgency = allDemandsResult.rows.filter(demand => !demand.expediteur_agency);
    
    if (demandsWithoutAgency.length > 0) {
      console.log(`⚠️ Found ${demandsWithoutAgency.length} demands without agency data:`);
      demandsWithoutAgency.forEach(demand => {
        console.log(`  - ID: ${demand.id}, Expéditeur: ${demand.expediteur_name} (${demand.expediteur_email}), Status: ${demand.status}`);
      });
      
      // Try to fix demands without agency data
      console.log('\n🔧 Attempting to fix demands without agency data...');
      
      for (const demand of demandsWithoutAgency) {
        // Find the shipper for this demand
        const shipperResult = await db.query(`
          SELECT agency, governorate FROM shippers 
          WHERE email = $1
        `, [demand.expediteur_email]);
        
        if (shipperResult.rows.length > 0) {
          const shipper = shipperResult.rows[0];
          console.log(`🔧 Found shipper for ${demand.expediteur_email}: agency=${shipper.agency}, governorate=${shipper.governorate}`);
          
          // Update the demand with the correct agency
          if (shipper.agency) {
            await db.query(`
              UPDATE demands 
              SET expediteur_agency = $1
              WHERE id = $2
            `, [shipper.agency, demand.id]);
            
            console.log(`✅ Updated demand ${demand.id} with agency: ${shipper.agency}`);
          }
        } else {
          console.log(`⚠️ No shipper found for email: ${demand.expediteur_email}`);
        }
      }
    } else {
      console.log('✅ All demands have agency data');
    }

    // Test filtering for the specific Chef d'agence
    console.log('\n📋 Testing filtering for Chef d\'agence "ben salah":');
    console.log('-' .repeat(50));
    
    const userEmail = 'bensalah@quickzone.tn';
    const userAgency = 'Entrepôt Sidi bouzid';
    
    console.log(`🔍 Testing filter for user: ${userEmail}, agency: ${userAgency}`);
    
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
    
    if (filteredDemandsResult.rows.length > 0) {
      filteredDemandsResult.rows.forEach(demand => {
        console.log(`  - ID: ${demand.id}, Expéditeur: ${demand.expediteur_name}, Agency: ${demand.expediteur_agency}, Status: ${demand.status}`);
      });
    } else {
      console.log('⚠️ No demands found for this agency');
    }

  } catch (error) {
    console.error('❌ Error checking existing demands:', error);
  } finally {
    process.exit(0);
  }
};

checkExistingDemands(); 