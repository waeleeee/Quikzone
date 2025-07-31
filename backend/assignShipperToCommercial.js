const db = require('./config/database');

const assignShipperToCommercial = async () => {
  try {
    console.log('🔗 Assigning shipper to commercial user...\n');
    
    // First, find Pierre (commercial user)
    const commercialResult = await db.query(`
      SELECT id, name, email
      FROM commercials 
      WHERE email = $1
    `, ['pierre@quickzone.tn']);
    
    if (commercialResult.rows.length === 0) {
      console.log('❌ Commercial user Pierre not found. Creating...');
      
      // Create Pierre as commercial user
      const createCommercialResult = await db.query(`
        INSERT INTO commercials (name, email, phone, status, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, name, email
      `, ['Pierre Dubois', 'pierre@quickzone.tn', '12345678', 'Actif']);
      
      console.log('✅ Created commercial user:', createCommercialResult.rows[0]);
      var commercial = createCommercialResult.rows[0];
    } else {
      console.log('✅ Found commercial user:', commercialResult.rows[0]);
      var commercial = commercialResult.rows[0];
    }
    
    // Find Ritej Chaieb (shipper)
    const shipperResult = await db.query(`
      SELECT id, name, email
      FROM shippers 
      WHERE email = $1
    `, ['ritejchaieb@icloud.com']);
    
    if (shipperResult.rows.length === 0) {
      console.log('❌ Shipper Ritej Chaieb not found');
      return;
    }
    
    const shipper = shipperResult.rows[0];
    console.log('✅ Found shipper:', shipper);
    
    // Check if already assigned
    if (shipper.commercial_id) {
      console.log('⚠️  Shipper already assigned to commercial ID:', shipper.commercial_id);
      
      // Update to assign to Pierre
      const updateResult = await db.query(`
        UPDATE shippers 
        SET commercial_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, name, email, commercial_id
      `, [commercial.id, shipper.id]);
      
      console.log('✅ Updated shipper assignment:', updateResult.rows[0]);
    } else {
      // Assign to Pierre
      const assignResult = await db.query(`
        UPDATE shippers 
        SET commercial_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, name, email, commercial_id
      `, [commercial.id, shipper.id]);
      
      console.log('✅ Assigned shipper to commercial:', assignResult.rows[0]);
    }
    
    // Verify the assignment
    const verifyResult = await db.query(`
      SELECT s.id, s.name, s.email, s.commercial_id, c.name as commercial_name
      FROM shippers s
      LEFT JOIN commercials c ON s.commercial_id = c.id
      WHERE s.email = $1
    `, ['ritejchaieb@icloud.com']);
    
    console.log('\n📋 Verification:');
    console.log('Shipper:', verifyResult.rows[0]);
    
    // Show all shippers assigned to Pierre
    const pierreShippersResult = await db.query(`
      SELECT s.id, s.name, s.email, s.commercial_id
      FROM shippers s
      WHERE s.commercial_id = $1
    `, [commercial.id]);
    
    console.log(`\n📦 Shippers assigned to Pierre (${commercial.name}):`);
    pierreShippersResult.rows.forEach((shipper, index) => {
      console.log(`  ${index + 1}. ${shipper.name} (${shipper.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

assignShipperToCommercial(); 