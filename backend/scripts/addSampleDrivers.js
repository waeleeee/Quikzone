const db = require('../config/database');

const addSampleDrivers = async () => {
  try {
    console.log('🚗 Adding sample drivers to the database...');

    const sampleDrivers = [
      {
        name: 'Pierre Dubois',
        email: 'pierre.livreur@quickzone.com',
        phone: '+216 71 234 567',
        governorate: 'Tunis',
        address: '12 Rue de Paris, Tunis',
        vehicle: 'Renault Kangoo',
        status: 'Disponible',
        cin_number: '12345678',
        driving_license: 'DL123456789',
        car_number: '123TUN456',
        car_type: 'Renault Kangoo',
        insurance_number: 'INS123456789',
        agency: 'Siège',
        photo_url: '',
        personal_documents_url: '',
        car_documents_url: ''
      },
      {
        name: 'Sarah Ahmed',
        email: 'sarah.livreur@quickzone.com',
        phone: '+216 73 456 789',
        governorate: 'Sousse',
        address: '34 Avenue Habib Bourguiba, Sousse',
        vehicle: 'Peugeot Partner',
        status: 'En mission',
        cin_number: '87654321',
        driving_license: 'DL987654321',
        car_number: '456SOU789',
        car_type: 'Peugeot Partner',
        insurance_number: 'INS987654321',
        agency: 'Sousse',
        photo_url: '',
        personal_documents_url: '',
        car_documents_url: ''
      },
      {
        name: 'Mohamed Ali',
        email: 'mohamed.livreur@quickzone.com',
        phone: '+216 74 789 123',
        governorate: 'Sfax',
        address: '56 Rue de la Liberté, Sfax',
        vehicle: 'Citroën Berlingo',
        status: 'Disponible',
        cin_number: '11223344',
        driving_license: 'DL112233445',
        car_number: '789SFA123',
        car_type: 'Citroën Berlingo',
        insurance_number: 'INS112233445',
        agency: 'Sfax',
        photo_url: '',
        personal_documents_url: '',
        car_documents_url: ''
      },
      {
        name: 'Fatima Ben Salem',
        email: 'fatima.livreur@quickzone.com',
        phone: '+216 75 321 654',
        governorate: 'Monastir',
        address: '78 Boulevard de la République, Monastir',
        vehicle: 'Fiat Doblo',
        status: 'Disponible',
        cin_number: '55667788',
        driving_license: 'DL556677889',
        car_number: '321MON654',
        car_type: 'Fiat Doblo',
        insurance_number: 'INS556677889',
        agency: 'Monastir',
        photo_url: '',
        personal_documents_url: '',
        car_documents_url: ''
      },
      {
        name: 'Karim Mansouri',
        email: 'karim.livreur@quickzone.com',
        phone: '+216 76 654 321',
        governorate: 'Tunis',
        address: '90 Rue du Lac Léman, Tunis',
        vehicle: 'Ford Transit',
        status: 'En mission',
        cin_number: '99887766',
        driving_license: 'DL998877665',
        car_number: '654TUN321',
        car_type: 'Ford Transit',
        insurance_number: 'INS998877665',
        agency: 'Siège',
        photo_url: '',
        personal_documents_url: '',
        car_documents_url: ''
      }
    ];

    for (const driver of sampleDrivers) {
      try {
        // Check if driver already exists
        const existingDriver = await db.query(
          'SELECT id FROM drivers WHERE email = $1',
          [driver.email]
        );

        if (existingDriver.rows.length === 0) {
          const result = await db.query(`
            INSERT INTO drivers (
              name, email, phone, governorate, address, vehicle, status,
              cin_number, driving_license, car_number, car_type, insurance_number, agency,
              photo_url, personal_documents_url, car_documents_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING id, name, email
          `, [
            driver.name, driver.email, driver.phone, driver.governorate, driver.address,
            driver.vehicle, driver.status, driver.cin_number, driver.driving_license,
            driver.car_number, driver.car_type, driver.insurance_number, driver.agency,
            driver.photo_url, driver.personal_documents_url, driver.car_documents_url
          ]);

          console.log(`✅ Added driver: ${result.rows[0].name} (${result.rows[0].email})`);
        } else {
          console.log(`⚠️ Driver already exists: ${driver.name} (${driver.email})`);
        }
      } catch (error) {
        console.error(`❌ Error adding driver ${driver.name}:`, error.message);
      }
    }

    // Show final count
    const countResult = await db.query('SELECT COUNT(*) FROM drivers');
    console.log(`\n📊 Total drivers in database: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error adding sample drivers:', error);
  } finally {
    process.exit(0);
  }
};

addSampleDrivers(); 