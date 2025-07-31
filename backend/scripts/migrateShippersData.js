const db = require('../config/database');

const migrateShippersData = async () => {
  try {
    console.log('🔧 Migrating shippers data to new structure...');

    // First, let's see what we have
    const currentShippers = await db.query('SELECT * FROM shippers LIMIT 5');
    console.log('📋 Current shippers structure:', currentShippers.rows);

    // Update existing shippers to have the new required fields
    const updateResult = await db.query(`
      UPDATE shippers 
      SET 
        agency = CASE 
          WHEN agency IS NULL OR agency = '' THEN 'Tunis'
          ELSE agency 
        END,
        delivery_fees = CASE 
          WHEN delivery_fees IS NULL THEN 0
          ELSE delivery_fees 
        END,
        return_fees = CASE 
          WHEN return_fees IS NULL THEN 0
          ELSE return_fees 
        END,
        status = CASE 
          WHEN status IS NULL OR status = '' THEN 'Actif'
          ELSE status 
        END,
        password = CASE 
          WHEN password IS NULL OR password = '' THEN 'password123'
          ELSE password 
        END,
        identity_number = CASE 
          WHEN identity_number IS NULL OR identity_number = '' THEN 'ID' || id
          ELSE identity_number 
        END,
        company_name = CASE 
          WHEN company_name IS NULL OR company_name = '' THEN company
          ELSE company_name 
        END,
        fiscal_number = CASE 
          WHEN fiscal_number IS NULL OR fiscal_number = '' THEN 'FISC' || id
          ELSE fiscal_number 
        END,
        company_address = CASE 
          WHEN company_address IS NULL OR company_address = '' THEN 'Adresse par défaut'
          ELSE company_address 
        END,
        company_governorate = CASE 
          WHEN company_governorate IS NULL OR company_governorate = '' THEN city
          ELSE company_governorate 
        END
      WHERE id > 0
    `);

    console.log('✅ Updated', updateResult.rowCount, 'shippers');

    // Show the updated data
    const updatedShippers = await db.query('SELECT id, code, name, email, agency, city, status FROM shippers LIMIT 5');
    console.log('📋 Updated shippers:', updatedShippers.rows);

    console.log('✅ Shippers data migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error migrating shippers data:', error);
    process.exit(1);
  }
};

migrateShippersData(); 