const db = require('./config/database');

const updateExpediteurAgency = async () => {
  try {
    console.log('🔧 Updating expéditeur agency...\n');

    const expediteurEmail = 'testbensalhexp@quickzone.tn';
    const newAgency = 'Entrepôt Sidi bouzid';

    // First, check if the expéditeur exists
    console.log('📋 Checking if expéditeur exists...');
    console.log('-' .repeat(50));
    
    const checkResult = await db.query(`
      SELECT 
        id,
        name,
        email,
        agency,
        governorate,
        created_at
      FROM shippers 
      WHERE email = $1
    `, [expediteurEmail]);
    
    if (checkResult.rows.length === 0) {
      console.log('❌ Expéditeur not found with email:', expediteurEmail);
      return;
    }

    const expediteur = checkResult.rows[0];
    console.log('✅ Expéditeur found:');
    console.log(`  - ID: ${expediteur.id}`);
    console.log(`  - Name: ${expediteur.name}`);
    console.log(`  - Email: ${expediteur.email}`);
    console.log(`  - Current Agency: ${expediteur.agency || 'NULL'}`);
    console.log(`  - Governorate: ${expediteur.governorate || 'NULL'}`);
    console.log(`  - Created: ${expediteur.created_at}`);

    // Check if the agency is already set correctly
    if (expediteur.agency === newAgency) {
      console.log('✅ Agency is already set correctly to:', newAgency);
      return;
    }

    // Update the expéditeur's agency
    console.log('\n🔧 Updating agency...');
    console.log('-' .repeat(50));
    
    const updateResult = await db.query(`
      UPDATE shippers 
      SET agency = $1, updated_at = NOW()
      WHERE email = $2
      RETURNING *
    `, [newAgency, expediteurEmail]);
    
    if (updateResult.rows.length > 0) {
      const updatedExpediteur = updateResult.rows[0];
      console.log('✅ Expéditeur updated successfully!');
      console.log(`  - ID: ${updatedExpediteur.id}`);
      console.log(`  - Name: ${updatedExpediteur.name}`);
      console.log(`  - Email: ${updatedExpediteur.email}`);
      console.log(`  - New Agency: ${updatedExpediteur.agency}`);
      console.log(`  - Updated: ${updatedExpediteur.updated_at}`);
    } else {
      console.log('❌ Failed to update expéditeur');
    }

    // Also update any existing demands for this expéditeur
    console.log('\n🔧 Updating existing demands...');
    console.log('-' .repeat(50));
    
    const demandsUpdateResult = await db.query(`
      UPDATE demands 
      SET expediteur_agency = $1, updated_at = NOW()
      WHERE expediteur_email = $2
      RETURNING id, expediteur_email, expediteur_agency
    `, [newAgency, expediteurEmail]);
    
    console.log(`✅ Updated ${demandsUpdateResult.rows.length} demands for this expéditeur`);
    
    if (demandsUpdateResult.rows.length > 0) {
      demandsUpdateResult.rows.forEach(demand => {
        console.log(`  - Demand ID: ${demand.id}, Agency: ${demand.expediteur_agency}`);
      });
    }

    // Check if there's a warehouse with this agency name to set as default_warehouse_id
    console.log('\n🔧 Checking for matching warehouse...');
    console.log('-' .repeat(50));
    
    const warehouseResult = await db.query(`
      SELECT id, name, governorate
      FROM warehouses 
      WHERE name = $1
    `, [newAgency]);
    
    if (warehouseResult.rows.length > 0) {
      const warehouse = warehouseResult.rows[0];
      console.log('✅ Found matching warehouse:');
      console.log(`  - ID: ${warehouse.id}`);
      console.log(`  - Name: ${warehouse.name}`);
      console.log(`  - Governorate: ${warehouse.governorate}`);
      
      // Update the expéditeur's default_warehouse_id
      const warehouseUpdateResult = await db.query(`
        UPDATE shippers 
        SET default_warehouse_id = $1, updated_at = NOW()
        WHERE email = $2
        RETURNING id, name, default_warehouse_id
      `, [warehouse.id, expediteurEmail]);
      
      if (warehouseUpdateResult.rows.length > 0) {
        console.log('✅ Updated default_warehouse_id to:', warehouse.id);
      }
    } else {
      console.log('⚠️ No warehouse found with name:', newAgency);
    }

    console.log('\n✅ Update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating expéditeur agency:', error);
  } finally {
    process.exit(0);
  }
};

updateExpediteurAgency(); 