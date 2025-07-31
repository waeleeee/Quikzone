const db = require('../config/database');

async function addSampleCommercialComplaints() {
  try {
    console.log('Adding sample commercial complaints...');
    
    // Get some commercial IDs and their assigned shippers
    const commercials = await db.query('SELECT id, name, email FROM commercials LIMIT 3');
    
    if (commercials.rows.length === 0) {
      console.log('No commercials found. Please create some commercials first.');
      return;
    }
    
    // Get shippers for each commercial
    for (const commercial of commercials.rows) {
      console.log(`Processing commercial: ${commercial.name} (ID: ${commercial.id})`);
      
      const shippers = await db.query('SELECT id, name, email FROM shippers WHERE commercial_id = $1 LIMIT 5', [commercial.id]);
      
      if (shippers.rows.length === 0) {
        console.log(`No shippers found for commercial ${commercial.name}`);
        continue;
      }
      
      console.log(`Found ${shippers.rows.length} shippers for commercial ${commercial.name}`);
      
              // Add sample complaints for each shipper
        for (const shipper of shippers.rows) {
          const sampleComplaints = [
            {
              client_id: shipper.id,
              subject: 'Retard de livraison',
              description: 'Le colis était prévu pour le 15/07/2024 mais n\'est toujours pas livré. Le client est très mécontent.',
              status: 'En attente'
            },
            {
              client_id: shipper.id,
              subject: 'Colis endommagé',
              description: 'Le colis est arrivé avec des signes de dommages. Le contenu semble intact mais l\'emballage est abîmé.',
              status: 'En cours de traitement'
            },
            {
              client_id: shipper.id,
              subject: 'Erreur d\'adresse',
              description: 'Le colis a été livré à la mauvaise adresse. Le client n\'a pas reçu son colis.',
              status: 'Traitée'
            },
            {
              client_id: shipper.id,
              subject: 'Problème de facturation',
              description: 'Le client conteste le montant facturé. Il y a une différence de 50€ sur la facture.',
              status: 'En attente'
            }
          ];
          
          for (const complaint of sampleComplaints) {
            try {
              await db.query(`
                INSERT INTO complaints (client_id, subject, description, status, created_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
              `, [complaint.client_id, complaint.subject, complaint.description, complaint.status]);
              
              console.log(`✅ Added complaint "${complaint.subject}" for shipper ${shipper.name}`);
            } catch (error) {
              console.error(`❌ Error adding complaint for shipper ${shipper.name}:`, error.message);
            }
          }
        }
    }
    
    console.log('🎉 Sample commercial complaints added successfully!');
    
    // Show summary
    const totalComplaints = await db.query(`
      SELECT COUNT(*) as total
      FROM complaints c
      JOIN shippers s ON c.client_id = s.id
      WHERE s.commercial_id IS NOT NULL
    `);
    
    console.log(`📊 Total commercial complaints: ${totalComplaints.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Error adding sample commercial complaints:', error);
  } finally {
    process.exit(0);
  }
}

addSampleCommercialComplaints(); 