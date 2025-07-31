const db = require('../config/database');

async function createCommercialPaymentsTable() {
  try {
    console.log('Creating commercial_payments table...');
    
    // Create commercial_payments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS commercial_payments (
        id SERIAL PRIMARY KEY,
        commercial_id INTEGER NOT NULL REFERENCES commercials(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('Commission', 'Salaire', 'Bonus')),
        description TEXT,
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        payment_method VARCHAR(100) NOT NULL,
        reference VARCHAR(100),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create index for better performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_commercial_payments_commercial_id ON commercial_payments(commercial_id)
    `);
    
    // Create index for status filtering
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_commercial_payments_status ON commercial_payments(status)
    `);
    
    // Create index for date filtering
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_commercial_payments_created_at ON commercial_payments(created_at)
    `);
    
    console.log('✅ commercial_payments table created successfully!');
    
    // Add some sample data for testing
    console.log('Adding sample commercial payments...');
    
    // Get some commercial IDs
    const commercials = await db.query('SELECT id FROM commercials LIMIT 3');
    
    if (commercials.rows.length > 0) {
      const samplePayments = [
        {
          commercial_id: commercials.rows[0].id,
          type: 'Commission',
          description: 'Commission sur les ventes du mois de juillet',
          amount: 250.00,
          payment_method: 'Virement bancaire',
          reference: 'COM-001-2024',
          status: 'paid'
        },
        {
          commercial_id: commercials.rows[0].id,
          type: 'Salaire',
          description: 'Salaire de base du mois de juillet',
          amount: 1200.00,
          payment_method: 'Virement bancaire',
          reference: 'SAL-001-2024',
          status: 'paid'
        },
        {
          commercial_id: commercials.rows[0].id,
          type: 'Bonus',
          description: 'Bonus de performance exceptionnelle',
          amount: 500.00,
          payment_method: 'Chèque',
          reference: 'BON-001-2024',
          status: 'pending'
        }
      ];
      
      for (const payment of samplePayments) {
        await db.query(`
          INSERT INTO commercial_payments (commercial_id, type, description, amount, payment_method, reference, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [payment.commercial_id, payment.type, payment.description, payment.amount, payment.payment_method, payment.reference, payment.status]);
      }
      
      console.log('✅ Sample commercial payments added successfully!');
    }
    
    console.log('🎉 Commercial payments system setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating commercial_payments table:', error);
  } finally {
    process.exit(0);
  }
}

createCommercialPaymentsTable(); 