const db = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Seeding QuickZone database with sample data...');

    // Seed test users
    await seedTestUsers();
    
    // Seed personnel data
    await seedPersonnel();
    
    // Seed shippers
    await seedShippers();
    
    // Seed parcels
    await seedParcels();
    
    // Seed missions
    await seedMissions();
    
    // Seed sectors and warehouses
    await seedGeographicData();
    
    // Seed payments and invoices
    await seedFinancialData();
    
    // Seed complaints
    await seedComplaints();

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

const seedTestUsers = async () => {
  console.log('👥 Seeding test users...');

  const testUsers = [
    {
      username: 'wael_admin',
      email: 'wael_admin@quickzone.tn',
      password: 'wael123',
      firstName: 'Wael',
      lastName: 'Admin',
      role: 'Administration'
    },
    {
      username: 'wael_commercial',
      email: 'wael_commercial@quickzone.tn',
      password: 'wael123',
      firstName: 'Wael',
      lastName: 'Commercial',
      role: 'Commercial'
    },
    {
      username: 'wael_finance',
      email: 'wael_finance@quickzone.tn',
      password: 'wael123',
      firstName: 'Wael',
      lastName: 'Finance',
      role: 'Finance'
    },
    {
      username: 'wael_chef_agence',
      email: 'wael_chef_agence@quickzone.tn',
      password: 'wael123',
      firstName: 'Wael',
      lastName: 'Chef Agence',
      role: 'Chef d\'agence'
    },
    {
      username: 'wael_membre_agence',
      email: 'wael_membre_agence@quickzone.tn',
      password: 'wael123',
      firstName: 'Wael',
      lastName: 'Membre Agence',
      role: 'Membre de l\'agence'
    },
    {
      username: 'wael_livreur',
      email: 'wael_livreur@quickzone.tn',
      password: 'wael123',
      firstName: 'Wael',
      lastName: 'Livreur',
      role: 'Livreurs'
    },
    {
      username: 'wael_expediteur',
      email: 'wael_expediteur@quickzone.tn',
      password: 'wael123',
      firstName: 'Wael',
      lastName: 'Expéditeur',
      role: 'Expéditeur'
    },
    {
      username: 'marie',
      email: 'marie@quickzone.tn',
      password: 'marie123',
      firstName: 'Marie',
      lastName: 'Dupont',
      role: 'Administration'
    },
    {
      username: 'pierre',
      email: 'pierre@quickzone.tn',
      password: 'pierre123',
      firstName: 'Pierre',
      lastName: 'Dubois',
      role: 'Commercial'
    },
    {
      username: 'sophie',
      email: 'sophie@quickzone.tn',
      password: 'sophie123',
      firstName: 'Sophie',
      lastName: 'Martin',
      role: 'Commercial'
    },
    {
      username: 'claude',
      email: 'claude@quickzone.tn',
      password: 'claude123',
      firstName: 'Claude',
      lastName: 'Bernard',
      role: 'Finance'
    },
    {
      username: 'isabelle',
      email: 'isabelle@quickzone.tn',
      password: 'isabelle123',
      firstName: 'Isabelle',
      lastName: 'Leroy',
      role: 'Finance'
    },
    {
      username: 'francois',
      email: 'francois@quickzone.tn',
      password: 'francois123',
      firstName: 'François',
      lastName: 'Petit',
      role: 'Chef d\'agence'
    },
    {
      username: 'nathalie',
      email: 'nathalie@quickzone.tn',
      password: 'nathalie123',
      firstName: 'Nathalie',
      lastName: 'Moreau',
      role: 'Chef d\'agence'
    },
    {
      username: 'thomas',
      email: 'thomas@quickzone.tn',
      password: 'thomas123',
      firstName: 'Thomas',
      lastName: 'Leroy',
      role: 'Membre de l\'agence'
    },
    {
      username: 'celine',
      email: 'celine@quickzone.tn',
      password: 'celine123',
      firstName: 'Céline',
      lastName: 'Rousseau',
      role: 'Membre de l\'agence'
    },
    {
      username: 'marc',
      email: 'marc@quickzone.tn',
      password: 'marc123',
      firstName: 'Marc',
      lastName: 'Simon',
      role: 'Livreurs'
    },
    {
      username: 'laurent',
      email: 'laurent@quickzone.tn',
      password: 'laurent123',
      firstName: 'Laurent',
      lastName: 'Girard',
      role: 'Livreurs'
    },
    {
      username: 'expediteur1',
      email: 'expediteur1@quickzone.tn',
      password: 'expediteur123',
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'Expéditeur'
    },
    {
      username: 'expediteur2',
      email: 'expediteur2@quickzone.tn',
      password: 'expediteur123',
      firstName: 'Marie',
      lastName: 'Martin',
      role: 'Expéditeur'
    }
  ];

  for (const userData of testUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Insert user
    const userResult = await db.query(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, email_verified) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING RETURNING id',
      [userData.username, userData.email, hashedPassword, userData.firstName, userData.lastName, true, true]
    );

    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      
      // Get role
      const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', [userData.role]);
      
      if (roleResult.rows.length > 0) {
        const roleId = roleResult.rows[0].id;
        
        // Assign role
        await db.query(
          'INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1, $2, $3) ON CONFLICT (user_id, role_id) DO NOTHING',
          [userId, roleId, userId]
        );
      }
    }
  }

  console.log('✅ Test users seeded successfully');
};

const seedPersonnel = async () => {
  console.log('👨‍💼 Seeding personnel data...');

  // Seed administrators
  await db.query(`
    INSERT INTO administrators (name, email, phone, governorate, address, role) VALUES
    ('Wael Admin', 'wael_admin@quickzone.tn', '+216 71 234 567', 'Béja', '123 Rue de la Paix, Béja', 'Administrateur Principal'),
    ('Admin Principal', 'admin.principal@quickzone.tn', '+216 71 234 568', 'Tunis', '124 Rue de la Paix, Tunis', 'Administrateur Principal'),
    ('Admin Secondaire', 'admin.secondaire@quickzone.tn', '+216 71 234 569', 'Sousse', '125 Rue de la Paix, Sousse', 'Administrateur')
    ON CONFLICT (email) DO NOTHING
  `);

  // Seed commercials
  await db.query(`
    INSERT INTO commercials (name, email, phone, governorate, address, title, clients_count, shipments_received) VALUES
    ('Wael Commercial', 'wael_commercial@quickzone.tn', '+216 71 234 567', 'Tunis', '55 Rue du Commerce, Tunis', 'Commercial', 15, 200),
    ('Jean Dupont', 'jean.dupont@quickzone.tn', '+216 71 234 568', 'Tunis', '56 Rue du Commerce, Tunis', 'Commercial', 12, 156),
    ('Alice Smith', 'alice.smith@quickzone.tn', '+216 98 765 432', 'Sousse', '123 Avenue Habib Bourguiba, Sousse', 'Senior Commercial', 20, 250),
    ('Mohamed Ben Ali', 'mohamed.benali@quickzone.tn', '+216 95 123 456', 'Sfax', '78 Rue de la Liberté, Sfax', 'Commercial', 8, 89)
    ON CONFLICT (email) DO NOTHING
  `);

  // Seed accountants
  await db.query(`
    INSERT INTO accountants (name, email, phone, governorate, address, title, agency) VALUES
    ('Wael Finance', 'wael_finance@quickzone.tn', '+216 21 123 456', 'Tunis', '12 Rue de la Liberté, Tunis', 'Comptable', 'Siège'),
    ('Sami Ben Ali', 'sami.benali@quickzone.tn', '+216 21 123 457', 'Tunis', '13 Rue de la Liberté, Tunis', 'Comptable', 'Siège'),
    ('Leila Trabelsi', 'leila.trabelsi@quickzone.tn', '+216 98 654 321', 'Sousse', '45 Avenue Habib Bourguiba, Sousse', 'Senior comptable', 'Sousse')
    ON CONFLICT (email) DO NOTHING
  `);

  // Seed agency managers
  await db.query(`
    INSERT INTO agency_managers (name, email, phone, governorate, address, agency) VALUES
    ('Wael Chef Agence', 'wael_chef_agence@quickzone.tn', '+216 20 123 456', 'Tunis', 'Rue de la République, Tunis', 'Tunis'),
    ('Amine Gharbi', 'amine.gharbi@quickzone.tn', '+216 20 123 457', 'Tunis', 'Rue de la République, Tunis', 'Tunis'),
    ('Sonia Ben Salah', 'sonia.bensalah@quickzone.tn', '+216 98 654 321', 'Sousse', 'Avenue de la Liberté, Sousse', 'Sousse')
    ON CONFLICT (email) DO NOTHING
  `);

  // Seed agency members
  await db.query(`
    INSERT INTO agency_members (name, email, phone, governorate, agency, role, status) VALUES
    ('Wael Membre Agence', 'wael_membre_agence@quickzone.tn', '+216 20 123 456', 'Tunis', 'Tunis', 'Responsable d''agence', 'Actif'),
    ('Pierre Dubois', 'pierre.membre@email.com', '+33 1 23 45 67 89', 'Tunis', 'Tunis', 'Responsable d''agence', 'Actif'),
    ('Sarah Ahmed', 'sarah.membre@email.com', '+33 1 98 76 54 32', 'Sousse', 'Sousse', 'Agent d''accueil', 'Actif'),
    ('Mohamed Ali', 'mohamed.membre@email.com', '+33 1 11 22 33 44', 'Sfax', 'Sfax', 'Gestionnaire de stock', 'Actif'),
    ('Fatima Ben Salem', 'fatima.membre@email.com', '+33 1 44 55 66 77', 'Monastir', 'Monastir', 'Agent de livraison', 'Inactif')
    ON CONFLICT (email) DO NOTHING
  `);

  // Seed drivers
  await db.query(`
    INSERT INTO drivers (name, email, phone, governorate, address, vehicle, status) VALUES
    ('Wael Livreur', 'wael_livreur@quickzone.tn', '+216 20 123 456', 'Tunis', '12 Rue de Paris, Tunis', 'Renault Kangoo', 'Disponible'),
    ('Pierre Dubois', 'pierre.livreur@email.com', '+33 1 23 45 67 89', 'Tunis', '13 Rue de Paris, Tunis', 'Renault Kangoo', 'Disponible'),
    ('Sarah Ahmed', 'sarah.livreur@email.com', '+33 1 98 76 54 32', 'Sousse', '34 Avenue Habib Bourguiba, Sousse', 'Peugeot Partner', 'Disponible'),
    ('Mohamed Ali', 'mohamed.livreur@email.com', '+33 1 11 22 33 44', 'Sfax', '56 Rue de la Liberté, Sfax', 'Citroën Berlingo', 'Disponible')
    ON CONFLICT (email) DO NOTHING
  `);

  console.log('✅ Personnel data seeded successfully');
};

const seedShippers = async () => {
  console.log('📦 Seeding shippers...');

  // await db.query(`
  //   INSERT INTO shippers (code, name, email, phone, company, total_parcels, delivered_parcels, returned_parcels, delivery_fees, return_fees, status, siret, fiscal_number, agency) VALUES
  //   ('EXP001', 'Wael Expéditeur', 'wael_expediteur@quickzone.tn', '+216 20 123 456', 'Wael Logistics', 50, 45, 5, 15.00, 10.00, 'Actif', '12345678901234', '12345678901234', 'Tunis'),
  //   ('EXP002', 'Pierre Dubois', 'pierre.dubois@email.com', '+33 1 23 45 67 89', 'Dubois Logistics', 45, 42, 5, 15.00, 10.00, 'Actif', '12345678901235', '12345678901235', 'Tunis'),
  //   ('EXP003', 'Sarah Ahmed', 'sarah.ahmed@email.com', '+33 1 98 76 54 32', 'Ahmed Trading', 32, 29, 3, 12.00, 8.00, 'Actif', '23456789012345', '23456789012345', 'Sousse'),
  //   ('EXP004', 'Mohamed Ali', 'mohamed.ali@email.com', '+33 1 11 22 33 44', 'Ali Import Export', 28, 24, 2, 18.00, 12.00, 'Inactif', '34567890123456', '34567890123456', 'Sfax')
  //   ON CONFLICT (email) DO NOTHING
  // `);

  console.log('✅ Shippers seeded successfully');
};

const seedParcels = async () => {
  console.log('📦 Seeding parcels...');

  // Get shipper IDs
  const shippers = await db.query('SELECT id FROM shippers LIMIT 3');
  
  if (shippers.rows.length > 0) {
    const shipperIds = shippers.rows.map(row => row.id);
    
    const parcels = [
      {
        tracking_number: 'C-123456',
        shipper_id: shipperIds[0],
        destination: 'Tunis',
        status: 'En attente',
        weight: 2.5,
        price: 15.00,
        type: 'Standard'
      },
      {
        tracking_number: 'C-654321',
        shipper_id: shipperIds[0],
        destination: 'Sousse',
        status: 'En cours',
        weight: 5.0,
        price: 18.00,
        type: 'Express'
      },
      {
        tracking_number: 'C-789012',
        shipper_id: shipperIds[1],
        destination: 'Sfax',
        status: 'Livrés',
        weight: 1.2,
        price: 12.00,
        type: 'Standard'
      }
    ];

    for (const parcel of parcels) {
      await db.query(`
        INSERT INTO parcels (tracking_number, shipper_id, destination, status, weight, price, type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (tracking_number) DO NOTHING
      `, [parcel.tracking_number, parcel.shipper_id, parcel.destination, parcel.status, parcel.weight, parcel.price, parcel.type]);

      // Add timeline entries
      const parcelResult = await db.query('SELECT id FROM parcels WHERE tracking_number = $1', [parcel.tracking_number]);
      if (parcelResult.rows.length > 0) {
        const parcelId = parcelResult.rows[0].id;
        
        await db.query(`
          INSERT INTO parcel_timeline (parcel_id, status, location, description)
          VALUES ($1, $2, $3, $4)
        `, [parcelId, parcel.status, parcel.destination, `Colis ${parcel.status.toLowerCase()}`]);
      }
    }
  }

  console.log('✅ Parcels seeded successfully');
};

const seedMissions = async () => {
  console.log('🚚 Seeding pickup missions...');

  // Get driver and shipper IDs
  const drivers = await db.query('SELECT id FROM drivers LIMIT 2');
  const shippers = await db.query('SELECT id FROM shippers LIMIT 2');

  if (drivers.rows.length > 0 && shippers.rows.length > 0) {
    await db.query(`
      INSERT INTO pickup_missions (mission_number, driver_id, shipper_id, scheduled_date, status)
      VALUES 
        ('PIK001', ${drivers.rows[0].id}, ${shippers.rows[0].id}, '2024-01-15 10:00:00', 'En attente'),
        ('PIK002', ${drivers.rows[1].id}, ${shippers.rows[1].id}, '2024-01-16 09:00:00', 'Livrés')
      ON CONFLICT (mission_number) DO NOTHING
    `);
  }

  console.log('✅ Pickup missions seeded successfully');
};

const seedGeographicData = async () => {
  console.log('🗺️ Seeding geographic data...');

  // Seed sectors
  await db.query(`
    INSERT INTO sectors (name, city, status) VALUES
    ('Secteur Nord', 'Paris, Lyon', 'Actif'),
    ('Secteur Sud', 'Marseille, Toulouse', 'Actif'),
    ('Secteur Est', 'Nice, Nantes', 'Inactif')
  `);

  // Seed warehouses
  await db.query(`
    INSERT INTO warehouses (name, governorate, address, current_stock, capacity, status) VALUES
    ('Entrepôt Tunis Central', 'Tunis', '123 Rue de la Paix, 1000 Tunis', 75, 100, 'Actif'),
    ('Entrepôt Sousse', 'Sousse', '456 Avenue Habib Bourguiba, 4000 Sousse', 60, 100, 'Actif'),
    ('Entrepôt Sfax', 'Sfax', '789 Rue de la Liberté, 3000 Sfax', 90, 100, 'Actif')
  `);

  console.log('✅ Geographic data seeded successfully');
};

const seedFinancialData = async () => {
  console.log('💰 Seeding financial data...');

  // Get shipper IDs
  const shippers = await db.query('SELECT id FROM shippers LIMIT 3');

  if (shippers.rows.length > 0) {
    const payments = [
      {
        shipper_id: shippers.rows[0].id,
        amount: 250.00,
        date: '2024-01-15',
        payment_method: 'Virement bancaire',
        reference: 'REF-001',
        status: 'Payé'
      },
      {
        shipper_id: shippers.rows[1].id,
        amount: 180.00,
        date: '2024-01-14',
        payment_method: 'Espèces',
        reference: 'REF-002',
        status: 'Payé'
      },
      {
        shipper_id: shippers.rows[2].id,
        amount: 320.00,
        date: '2024-01-13',
        payment_method: 'Chèque',
        reference: 'REF-003',
        status: 'En attente'
      }
    ];

    for (const payment of payments) {
      const paymentResult = await db.query(`
        INSERT INTO payments (shipper_id, amount, date, payment_method, reference, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [payment.shipper_id, payment.amount, payment.date, payment.payment_method, payment.reference, payment.status]);

      if (paymentResult.rows.length > 0) {
        const paymentId = paymentResult.rows[0].id;
        
        // Create invoice
        await db.query(`
          INSERT INTO invoices (payment_id, invoice_number, client_name, client_phone, delivery_address, weight, base_delivery_cost, total_ht, tva, total_ttc)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          paymentId,
          `INV-${paymentId.toString().padStart(6, '0')}`,
          'Client Demo',
          '+216 71 234 567',
          'Adresse de livraison demo',
          2.5,
          8.00,
          29.17,
          5.83,
          43.00
        ]);
      }
    }
  }

  console.log('✅ Financial data seeded successfully');
};

const seedComplaints = async () => {
  console.log('📝 Seeding complaints...');

  // Get shipper IDs
  const shippers = await db.query('SELECT id FROM shippers LIMIT 3');

  if (shippers.rows.length > 0) {
    await db.query(`
      INSERT INTO complaints (client_id, subject, description, date, status) VALUES
      (${shippers.rows[0].id}, 'Colis endommagé', 'Le colis est arrivé endommagé', '2024-01-15', 'En attente'),
      (${shippers.rows[1].id}, 'Retard de livraison', 'La livraison a pris plus de temps que prévu', '2024-01-14', 'Traitée'),
      (${shippers.rows[2].id}, 'Erreur d''adresse', 'Le colis a été livré à la mauvaise adresse', '2024-01-13', 'Rejetée')
    `);
  }

  console.log('✅ Complaints seeded successfully');
};

seedData(); 