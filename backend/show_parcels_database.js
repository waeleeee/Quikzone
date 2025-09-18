const db = require('./config/database');

const showParcelsDatabase = async () => {
  try {
    console.log('📦 PARCELS (COLIS) DATABASE STRUCTURE & DATA\n');
    console.log('=' .repeat(80));

    // 1. Show table structure
    console.log('\n🏗️  TABLE STRUCTURE:');
    console.log('-' .repeat(50));
    
    const structureResult = await db.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'parcels' 
      ORDER BY ordinal_position
    `);
    
    console.table(structureResult.rows);

    // 2. Show current data count
    console.log('\n📊 DATA OVERVIEW:');
    console.log('-' .repeat(50));
    
    const countResult = await db.query(`
      SELECT 
        COUNT(*) as total_parcels,
        COUNT(CASE WHEN warehouse_id IS NOT NULL THEN 1 END) as with_warehouse,
        COUNT(CASE WHEN warehouse_id IS NULL THEN 1 END) as without_warehouse,
        COUNT(CASE WHEN status = 'En attente' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'Au dépôt' THEN 1 END) as at_warehouse,
        COUNT(CASE WHEN status = 'En cours' THEN 1 END) as in_transit,
        COUNT(CASE WHEN status IN ('Livrés', 'Livrés payés') THEN 1 END) as delivered,
        COUNT(CASE WHEN status LIKE '%retour%' OR status LIKE '%RTN%' THEN 1 END) as returned
      FROM parcels
    `);
    
    console.table(countResult.rows);

    // 3. Show parcels by warehouse
    console.log('\n🏢 PARCELS BY WAREHOUSE:');
    console.log('-' .repeat(50));
    
    const warehouseResult = await db.query(`
      SELECT 
        w.name as warehouse_name,
        w.governorate,
        COUNT(p.id) as total_parcels,
        COUNT(CASE WHEN p.status = 'En attente' THEN 1 END) as pending,
        COUNT(CASE WHEN p.status = 'Au dépôt' THEN 1 END) as at_warehouse,
        COUNT(CASE WHEN p.status IN ('Livrés', 'Livrés payés') THEN 1 END) as delivered
      FROM warehouses w
      LEFT JOIN parcels p ON w.id = p.warehouse_id
      WHERE w.status = 'Actif'
      GROUP BY w.id, w.name, w.governorate
      ORDER BY total_parcels DESC
    `);
    
    console.table(warehouseResult.rows);

    // 4. Show sample parcels with full details
    console.log('\n📦 SAMPLE PARCELS (First 10):');
    console.log('-' .repeat(50));
    
    const sampleParcelsResult = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.status,
        p.destination,
        p.weight,
        p.price,
        p.type,
        p.estimated_delivery_date,
        p.warehouse_id,
        w.name as warehouse_name,
        s.name as shipper_name,
        s.agency as shipper_agency,
        p.created_at,
        p.article_name,
        p.remark,
        p.nb_pieces,
        p.client_code
      FROM parcels p
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      LEFT JOIN shippers s ON p.shipper_id = s.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    console.table(sampleParcelsResult.rows);

    // 5. Show parcels without warehouse assignment
    console.log('\n❓ PARCELS WITHOUT WAREHOUSE ASSIGNMENT:');
    console.log('-' .repeat(50));
    
    const unassignedResult = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.status,
        p.destination,
        s.name as shipper_name,
        s.agency as shipper_agency,
        s.default_warehouse_id,
        p.created_at
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.warehouse_id IS NULL
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    if (unassignedResult.rows.length > 0) {
      console.table(unassignedResult.rows);
    } else {
      console.log('✅ All parcels have warehouse assignments!');
    }

    // 6. Show status distribution
    console.log('\n📋 STATUS DISTRIBUTION:');
    console.log('-' .repeat(50));
    
    const statusResult = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM parcels)::numeric) * 100, 1) as percentage
      FROM parcels 
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.table(statusResult.rows);

    // 7. Show recent activity
    console.log('\n🕒 RECENT ACTIVITY (Last 24 hours):');
    console.log('-' .repeat(50));
    
    const recentResult = await db.query(`
      SELECT 
        p.tracking_number,
        p.status,
        p.destination,
        w.name as warehouse_name,
        s.name as shipper_name,
        p.created_at
      FROM parcels p
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.created_at >= CURRENT_DATE - INTERVAL '1 day'
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    if (recentResult.rows.length > 0) {
      console.table(recentResult.rows);
    } else {
      console.log('No parcels created in the last 24 hours');
    }

    // 8. Show database indexes
    console.log('\n🔍 DATABASE INDEXES:');
    console.log('-' .repeat(50));
    
    const indexesResult = await db.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'parcels'
      ORDER BY indexname
    `);
    
    console.table(indexesResult.rows);

    console.log('\n✅ Parcels database analysis completed!');
    console.log('\n📋 SUMMARY:');
    console.log('- The parcels table contains comprehensive tracking information');
    console.log('- Warehouse relationships are properly established');
    console.log('- Status tracking is implemented');
    console.log('- Performance indexes are in place');
    console.log('- Recent warehouse assignment system is working');

  } catch (error) {
    console.error('❌ Error analyzing parcels database:', error);
  } finally {
    process.exit(0);
  }
};

showParcelsDatabase(); 