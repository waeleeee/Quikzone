const db = require('../config/database');

const testWarehouseDetails = async () => {
  try {
    console.log('🧪 Testing warehouse details API...');

    // Test warehouse ID 11 (Entrepôt Sousse)
    const warehouseId = 11;
    
    console.log(`\n📦 Testing warehouse details for ID: ${warehouseId}`);
    
    // Get warehouse details
    const warehouseResult = await db.query(`
      SELECT 
        w.*,
        COALESCE(NULLIF(CONCAT(u.first_name, ' ', u.last_name), ' '), 'Non assigné') as manager_name,
        COALESCE(u.email, 'Non renseigné') as manager_email,
        COALESCE(u.phone, 'Non renseigné') as manager_phone,
        ROUND(((COALESCE(w.current_stock, 0)::numeric / COALESCE(w.capacity, 100)::numeric) * 100)::numeric, 1) as stock_percentage
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      WHERE w.id = $1
    `, [warehouseId]);
    
    if (warehouseResult.rows.length === 0) {
      console.log('❌ Warehouse not found');
      return;
    }
    
    const warehouse = warehouseResult.rows[0];
    console.log('✅ Warehouse found:', warehouse.name);
    
    // Get warehouse statistics
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_parcels,
        COUNT(CASE WHEN status IN ('Livrés', 'Livrés payés') THEN 1 END) as delivered_today,
        COUNT(CASE WHEN status IN ('En attente', 'À enlever', 'Enlevé', 'Au dépôt', 'En cours') THEN 1 END) as pending_parcels,
        AVG(CASE WHEN status IN ('Livrés', 'Livrés payés') THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 END) as avg_delivery_time_hours
      FROM parcels 
      WHERE warehouse_id = $1
    `, [warehouseId]);
    
    console.log('\n📊 Statistics:');
    console.log('Total parcels:', statsResult.rows[0]?.total_parcels || 0);
    console.log('Delivered today:', statsResult.rows[0]?.delivered_today || 0);
    console.log('Pending parcels:', statsResult.rows[0]?.pending_parcels || 0);
    console.log('Average delivery time:', statsResult.rows[0]?.avg_delivery_time_hours ? 
      `${Math.round(statsResult.rows[0].avg_delivery_time_hours * 10) / 10}h` : '0h');
    
    // Get parcels by status
    const parcelsByStatusResult = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM parcels 
      WHERE warehouse_id = $1
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'En attente' THEN 1
          WHEN 'À enlever' THEN 2
          WHEN 'Enlevé' THEN 3
          WHEN 'Au dépôt' THEN 4
          WHEN 'En cours' THEN 5
          WHEN 'RTN dépôt' THEN 6
          WHEN 'Livrés' THEN 7
          WHEN 'Livrés payés' THEN 8
          WHEN 'Retour définitif' THEN 9
          WHEN 'RTN client dépôt' THEN 10
          WHEN 'Retour Expéditeur' THEN 11
          WHEN 'Retour en cours d\'expédition' THEN 12
          WHEN 'Retour reçu' THEN 13
          ELSE 14
        END
    `, [warehouseId]);
    
    console.log('\n📦 Parcels by status:');
    console.table(parcelsByStatusResult.rows);
    
    console.log('\n✅ Warehouse details test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing warehouse details:', error);
    process.exit(1);
  }
};

testWarehouseDetails(); 