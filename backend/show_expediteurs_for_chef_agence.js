const db = require('./config/database');

const showExpediteursForChefAgence = async () => {
  try {
    console.log('🔍 Showing expéditeurs for Chef d\'agence...\n');

    const chefAgenceEmail = 'bensalah@quickzone.tn';

    // Get Chef d'agence agency
    const chefResult = await db.query(`
      SELECT agency FROM agency_managers WHERE email = $1
    `, [chefAgenceEmail]);

    if (chefResult.rows.length === 0) {
      console.log('❌ Chef d\'agence not found');
      return;
    }

    const chefAgency = chefResult.rows[0].agency;
    console.log(`📋 Chef d'agence agency: "${chefAgency}"`);

    // Get all expéditeurs with the same agency
    const expediteursResult = await db.query(`
      SELECT id, name, email, agency, governorate
      FROM shippers
      WHERE agency = $1
      ORDER BY name
    `, [chefAgency]);

    console.log(`\n📋 Expéditeurs for agency "${chefAgency}":`);
    console.log(`Total: ${expediteursResult.rows.length} expéditeurs\n`);

    expediteursResult.rows.forEach((exp, index) => {
      console.log(`${index + 1}. ${exp.name} (${exp.email})`);
      console.log(`   Agency: ${exp.agency}`);
      console.log(`   Governorate: ${exp.governorate || 'Not set'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
};

showExpediteursForChefAgence(); 