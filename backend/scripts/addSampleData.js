const db = require('../config/database');

const addSampleData = async () => {
  try {
    console.log('📊 Adding sample payments and parcels data...');
    
    // Get all shippers
    const shippersResult = await db.query('SELECT id, name, company FROM shippers');
    const shippers = shippersResult.rows;
    
    console.log(`Found ${shippers.length} shippers`);
    
    // Add sample payments for each shipper
    for (const shipper of shippers) {
      const paymentMethods = ['Virement bancaire', 'Espèces', 'Chèque', 'Carte bancaire'];
      const statuses = ['paid', 'pending'];
      
      // Add 2-3 payments per shipper
      for (let i = 0; i < 3; i++) {
        const amount = Math.floor(Math.random() * 500) + 100; // 100-600€
        const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date in last 30 days
        
        await db.query(`
          INSERT INTO payments (shipper_id, amount, date, payment_method, reference, status)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          shipper.id,
          amount,
          date.toISOString().split('T')[0],
          method,
          `REF-${shipper.id}-${i + 1}`,
          status
        ]);
      }
    }
    
    console.log('✅ Added sample payments');
    
    // Add sample parcels for each shipper
    for (const shipper of shippers) {
      const statuses = ['delivered', 'in_transit', 'pending'];
      const totalParcels = shipper.total_parcels || 30;
      
      // Add parcels based on the shipper's total_parcels
      for (let i = 0; i < Math.min(totalParcels, 10); i++) { // Max 10 parcels per shipper
        const amount = Math.floor(Math.random() * 50) + 10; // 10-60€
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // Random date in last 60 days
        
        await db.query(`
          INSERT INTO parcels (tracking_number, shipper_id, destination, status, weight, price, created_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          `COL-${shipper.id}-${i + 1}`,
          shipper.id,
          'Tunis, Tunisie',
          status,
          (Math.random() * 5 + 0.5).toFixed(2), // 0.5-5.5kg
          amount,
          date.toISOString()
        ]);
      }
    }
    
    console.log('✅ Added sample parcels');
    
    // Update shipper statistics
    for (const shipper of shippers) {
      // Calculate delivered parcels
      const deliveredResult = await db.query(`
        SELECT COUNT(*) as count FROM parcels 
        WHERE shipper_id = $1 AND status = 'delivered'
      `, [shipper.id]);
      
      const deliveredParcels = parseInt(deliveredResult.rows[0].count);
      
      // Calculate total revenue
      const revenueResult = await db.query(`
        SELECT SUM(price) as total FROM parcels 
        WHERE shipper_id = $1 AND status = 'delivered'
      `, [shipper.id]);
      
      const totalRevenue = parseFloat(revenueResult.rows[0].total || 0);
      
      // Update shipper
      await db.query(`
        UPDATE shippers 
        SET delivered_parcels = $1, total_revenue = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [deliveredParcels, totalRevenue, shipper.id]);
    }
    
    console.log('✅ Updated shipper statistics');
    
    console.log('🎉 Sample data added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  } finally {
    process.exit(0);
  }
};

addSampleData(); 