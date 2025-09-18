const db = require('./config/database');

const showChefAgenceExpediteurs = async () => {
  try {
    console.log('🔍 Showing expéditeurs for Chef d\'agence agency...\n');

    const chefAgenceEmail = 'bensalah@quickzone.tn';

    // First, get the Chef d'agence's agency
    console.log('📋 Getting Chef d\'agence agency...');
    console.log('-' .repeat(50));
    
    const agencyResult = await db.query(`
      SELECT agency, governorate
      FROM agency_managers 
      WHERE email = $1
    `, [chefAgenceEmail]);
    
    if (agencyResult.rows.length === 0) {
      console.log('❌ No agency found for Chef d\'agence:', chefAgenceEmail);
      return;
    }

    const chefAgency = agencyResult.rows[0].agency;
    const chefGovernorate = agencyResult.rows[0].governorate;
    
    console.log('✅ Chef d\'agence agency:', chefAgency);
    console.log('✅ Chef d\'agence governorate:', chefGovernorate);

    // Get expéditeurs that belong to this agency
    console.log('\n📋 Expéditeurs for agency:', chefAgency);
    console.log('-' .repeat(50));
    
    const expediteursResult = await db.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        agency,
        governorate,
        address,
        default_warehouse_id,
        commercial_id,
        delivery_fees,
        return_fees,
        status,
        created_at,
        updated_at
      FROM shippers
      WHERE agency = $1
      ORDER BY created_at DESC
    `, [chefAgency]);
    
    console.log(`📋 Total expéditeurs for agency "${chefAgency}": ${expediteursResult.rows.length}`);
    
    if (expediteursResult.rows.length > 0) {
      console.log('📋 Expéditeurs list:');
      expediteursResult.rows.forEach(expediteur => {
        console.log(`\n  🔹 ID: ${expediteur.id}`);
        console.log(`     Name: ${expediteur.name}`);
        console.log(`     Email: ${expediteur.email}`);
        console.log(`     Phone: ${expediteur.phone || 'Not provided'}`);
        console.log(`     Agency: ${expediteur.agency}`);
        console.log(`     Governorate: ${expediteur.governorate || 'NULL'}`);
        console.log(`     Address: ${expediteur.address || 'Not provided'}`);
        console.log(`     Default Warehouse ID: ${expediteur.default_warehouse_id || 'Not assigned'}`);
        console.log(`     Commercial ID: ${expediteur.commercial_id || 'Not assigned'}`);
        console.log(`     Delivery Fees: ${expediteur.delivery_fees || 'Not set'}`);
        console.log(`     Return Fees: ${expediteur.return_fees || 'Not set'}`);
        console.log(`     Status: ${expediteur.status || 'Not set'}`);
        console.log(`     Created: ${expediteur.created_at}`);
        console.log(`     Updated: ${expediteur.updated_at}`);
      });
    } else {
      console.log('⚠️ No expéditeurs found for this agency');
      
      // Show all expéditeurs to see what agencies exist
      console.log('\n📋 All expéditeurs in system (for reference):');
      console.log('-' .repeat(50));
      
      const allExpediteursResult = await db.query(`
        SELECT id, name, email, agency, governorate
        FROM shippers
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      allExpediteursResult.rows.forEach(expediteur => {
        console.log(`  - ID: ${expediteur.id}, Name: ${expediteur.name}, Email: ${expediteur.email}, Agency: ${expediteur.agency || 'NULL'}, Governorate: ${expediteur.governorate || 'NULL'}`);
      });
    }

    // Also check if there are any expéditeurs with similar agency names
    console.log('\n📋 Checking for similar agency names...');
    console.log('-' .repeat(50));
    
    const similarAgencyResult = await db.query(`
      SELECT DISTINCT agency
      FROM shippers
      WHERE agency ILIKE $1
      ORDER BY agency
    `, [`%${chefAgency.split(' ').pop()}%`]); // Check for agencies containing the last word of chef agency
    
    if (similarAgencyResult.rows.length > 0) {
      console.log('📋 Similar agency names found:');
      similarAgencyResult.rows.forEach(row => {
        console.log(`  - ${row.agency}`);
      });
    } else {
      console.log('⚠️ No similar agency names found');
    }

  } catch (error) {
    console.error('❌ Error showing Chef d\'agence expéditeurs:', error);
  } finally {
    process.exit(0);
  }
};

showChefAgenceExpediteurs(); 