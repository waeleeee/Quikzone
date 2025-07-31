const { Pool } = require('pg');
require('dotenv').config({ path: './config.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waelrh',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: false
});

const sampleComplaints = [
  {
    order_number: 'QZ-12345',
    customer_email: 'wael.expediteur@quickzone.tn',
    customer_name: 'Wael Expéditeur',
    problem_type: 'Retard de livraison',
    description: 'Ma commande était prévue pour 14h00 mais elle n\'est toujours pas arrivée à 16h30. C\'est très gênant car j\'avais des plans pour ce soir.',
    status: 'En attente',
    created_at: new Date('2024-01-15T10:30:00Z')
  },
  {
    order_number: 'QZ-12346',
    customer_email: 'nadia.gharbi@quickzone.tn',
    customer_name: 'Nadia Gharbi',
    problem_type: 'Colis endommagé',
    description: 'Le colis est arrivé avec des traces d\'humidité et l\'emballage était déchiré. Le contenu semble intact mais je suis inquiète.',
    status: 'En cours de traitement',
    created_at: new Date('2024-01-14T15:45:00Z')
  },
  {
    order_number: 'QZ-12347',
    customer_email: 'ahmed.benali@quickzone.tn',
    customer_name: 'Ahmed Ben Ali',
    problem_type: 'Mauvais article reçu',
    description: 'J\'ai commandé un smartphone Samsung Galaxy S23 mais j\'ai reçu un iPhone 14. Je veux échanger pour le bon produit.',
    status: 'Traitée',
    created_at: new Date('2024-01-13T09:15:00Z')
  },
  {
    order_number: 'QZ-12348',
    customer_email: 'sarah.martin@quickzone.tn',
    customer_name: 'Sarah Martin',
    problem_type: 'Erreur d\'adresse',
    description: 'Le livreur a livré à la mauvaise adresse. J\'habite au 15 rue de la Paix, pas au 51. Pouvez-vous corriger cela ?',
    status: 'En attente',
    created_at: new Date('2024-01-12T11:20:00Z')
  },
  {
    order_number: 'QZ-12349',
    customer_email: 'mohamed.khalil@quickzone.tn',
    customer_name: 'Mohamed Khalil',
    problem_type: 'Problème de facturation',
    description: 'J\'ai été facturé deux fois pour la même commande. Pouvez-vous vérifier et rembourser le montant en double ?',
    status: 'Traitée',
    created_at: new Date('2024-01-11T14:30:00Z')
  },
  {
    order_number: 'QZ-12350',
    customer_email: 'fatima.zouari@quickzone.tn',
    customer_name: 'Fatima Zouari',
    problem_type: 'Service client insatisfaisant',
    description: 'J\'ai appelé le service client plusieurs fois mais personne ne répond. C\'est très frustrant quand on a un problème urgent.',
    status: 'Rejetée',
    created_at: new Date('2024-01-10T16:45:00Z')
  },
  {
    order_number: 'QZ-12351',
    customer_email: 'pierre.dubois@quickzone.tn',
    customer_name: 'Pierre Dubois',
    problem_type: 'Retard de livraison',
    description: 'Commande en retard de plus de 2 heures. Le livreur n\'a pas appelé pour prévenir. Service décevant.',
    status: 'En cours de traitement',
    created_at: new Date('2024-01-09T13:10:00Z')
  },
  {
    order_number: 'QZ-12352',
    customer_email: 'marie.laurent@quickzone.tn',
    customer_name: 'Marie Laurent',
    problem_type: 'Colis endommagé',
    description: 'Le colis contenait des produits alimentaires qui ont été écrasés pendant le transport. Tout est inutilisable.',
    status: 'En attente',
    created_at: new Date('2024-01-08T10:25:00Z')
  }
];

async function addSampleComplaints() {
  let client;
  
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    
    console.log('Connected to database successfully!');
    
    // Check if complaints table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'complaints'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Creating complaints table...');
      await client.query(`
        CREATE TABLE complaints (
          id SERIAL PRIMARY KEY,
          order_number VARCHAR(50) NOT NULL,
          customer_email VARCHAR(255) NOT NULL,
          customer_name VARCHAR(255) NOT NULL,
          problem_type VARCHAR(100) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'En attente' CHECK (status IN ('En attente', 'En cours de traitement', 'Traitée', 'Rejetée')),
          attachments JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Complaints table created successfully!');
    } else {
      console.log('Complaints table already exists.');
    }
    
    // Check if there are already complaints
    const existingComplaints = await client.query('SELECT COUNT(*) as count FROM complaints');
    
    if (parseInt(existingComplaints.rows[0].count) > 0) {
      console.log(`Found ${existingComplaints.rows[0].count} existing complaints. Skipping sample data insertion.`);
      return;
    }
    
    // Insert sample complaints
    console.log('Inserting sample complaints...');
    
    for (const complaint of sampleComplaints) {
      await client.query(`
        INSERT INTO complaints (
          order_number, 
          customer_email, 
          customer_name, 
          problem_type, 
          description, 
          status, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        complaint.order_number,
        complaint.customer_email,
        complaint.customer_name,
        complaint.problem_type,
        complaint.description,
        complaint.status,
        complaint.created_at
      ]);
    }
    
    console.log(`Successfully added ${sampleComplaints.length} sample complaints!`);
    
    // Display the added complaints
    const addedComplaints = await client.query('SELECT * FROM complaints ORDER BY created_at DESC');
    console.log('\nAdded complaints:');
    addedComplaints.rows.forEach((complaint, index) => {
      console.log(`${index + 1}. ${complaint.customer_name} - ${complaint.problem_type} (${complaint.status})`);
    });
    
  } catch (error) {
    console.error('Error adding sample complaints:', error);
  } finally {
    if (client) {
      client.release();
      console.log('Database connection released.');
    }
    await pool.end();
    console.log('Database pool closed.');
  }
}

// Run the script
addSampleComplaints(); 