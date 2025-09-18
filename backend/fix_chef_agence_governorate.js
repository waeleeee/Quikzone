const db = require('./config/database');

const fixChefAgenceGovernorate = async () => {
  try {
    console.log('🔧 Fixing Chef d\'agence governorate data...\n');

    // Update the user's governorate and agency based on their warehouse
    const userEmail = 'saadaouiossama@gmail.com';
    
    console.log('📋 Updating user data for:', userEmail);
    console.log('-' .repeat(50));
    
    // First, check what warehouse this user manages
    const warehouseResult = await db.query(`
      SELECT 
        w.id,
        w.name,
        w.governorate,
        w.address,
        u.first_name || ' ' || u.last_name as manager_name,
        u.email as manager_email
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      WHERE u.email = $1
    `, [userEmail]);
    
    if (warehouseResult.rows.length > 0) {
      const warehouse = warehouseResult.rows[0];
      console.log('✅ User manages warehouse:', warehouse);
      console.log('📍 Warehouse governorate:', warehouse.governorate);
      
      // Update the agency_managers table
      const updateResult = await db.query(`
        UPDATE agency_managers 
        SET 
          governorate = $1,
          agency = $2,
          updated_at = NOW()
        WHERE email = $3
      `, [warehouse.governorate, warehouse.name, userEmail]);
      
      if (updateResult.rowCount > 0) {
        console.log('✅ Successfully updated agency_managers table');
        console.log(`📍 Set governorate to: ${warehouse.governorate}`);
        console.log(`🏢 Set agency to: ${warehouse.name}`);
      } else {
        console.log('❌ No rows updated - user might not exist in agency_managers table');
        
        // Insert the user if they don't exist
        const insertResult = await db.query(`
          INSERT INTO agency_managers (name, email, phone, governorate, agency, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [
          'Saadaoui Ossama',
          userEmail,
          '+21694329567',
          warehouse.governorate,
          warehouse.name
        ]);
        
        if (insertResult.rowCount > 0) {
          console.log('✅ Successfully inserted user into agency_managers table');
        }
      }
    } else {
      console.log('❌ User is not managing any warehouse');
    }

    // Verify the update
    console.log('\n📋 Verifying the update...');
    console.log('-' .repeat(50));
    
    const verifyResult = await db.query(`
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
    
    if (verifyResult.rows.length > 0) {
      const user = verifyResult.rows[0];
      console.log('✅ Updated user data:', user);
      console.log('📍 User governorate:', user.governorate);
      console.log('🏢 User agency:', user.agency);
    }

  } catch (error) {
    console.error('❌ Error fixing Chef d\'agence governorate:', error);
  } finally {
    process.exit(0);
  }
};

fixChefAgenceGovernorate(); 