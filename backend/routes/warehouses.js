const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get available managers for warehouse assignment (not assigned to any warehouse)
router.get('/available-managers', async (req, res) => {
  try {
    console.log('🔍 Fetching available managers for warehouse assignment...');
    
    // First, let's check what roles exist in the system
    const rolesResult = await db.query(`
      SELECT DISTINCT r.name as role_name
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id IS NOT NULL
      ORDER BY r.name
    `);
    
    console.log('📋 Available roles in system:', rolesResult.rows.map(r => r.role_name));
    
    // Get all active users who are not assigned to any warehouse
    // Only return users with "Chef d'agence" role for warehouse management
    const availableManagersResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        r.name as role,
        CASE WHEN u.is_active THEN 'Actif' ELSE 'Inactif' END as status
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN warehouses w ON u.id = w.manager_id
      WHERE u.is_active = true
        AND w.id IS NULL
        AND r.name = 'Chef d''agence'
      ORDER BY u.first_name, u.last_name
    `);
    
    console.log(`✅ Found ${availableManagersResult.rows.length} available managers`);
    
    // If no Chef d'agence found, return empty array with message
    if (availableManagersResult.rows.length === 0) {
      console.log('⚠️ No Chef d\'agence users available for warehouse assignment');
      
      res.json({
        success: true,
        data: [],
        message: 'Aucun Chef d\'agence disponible pour l\'assignation à un entrepôt'
      });
    } else {
      res.json({
        success: true,
        data: availableManagersResult.rows
      });
    }
  } catch (error) {
    console.error('Get available managers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available managers'
    });
  }
});

// Get all warehouses with detailed information
router.get('/', async (req, res) => {
  try {
    console.log('🚀 Warehouses route hit!');
    
    const result = await db.query(`
      SELECT 
        w.*,
        COALESCE(NULLIF(CONCAT(u.first_name, ' ', u.last_name), ' '), 'Non assigné') as manager_name,
        COALESCE(u.email, 'Non renseigné') as manager_email,
        COALESCE(u.phone, 'Non renseigné') as manager_phone,
        COALESCE(w.current_stock, 0) as current_stock,
        COALESCE(w.capacity, 100) as capacity,
        ROUND(((COALESCE(w.current_stock, 0)::numeric / COALESCE(w.capacity, 100)::numeric) * 100)::numeric, 1) as stock_percentage
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      ORDER BY w.created_at DESC
    `);
    
    console.log(`✅ Warehouses query result: ${result.rows.length} warehouses`);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouses'
    });
  }
});

// Get warehouse details with statistics
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
    `, [id]);
    
    if (warehouseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }
    
    const warehouse = warehouseResult.rows[0];
    
    // Get warehouse statistics using the new warehouse_id column
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_parcels,
        COUNT(CASE WHEN status IN ('Livrés', 'Livrés payés') THEN 1 END) as delivered_today,
        COUNT(CASE WHEN status IN ('En attente', 'À enlever', 'Enlevé', 'Au dépôt', 'En cours') THEN 1 END) as pending_parcels,
        AVG(CASE WHEN status IN ('Livrés', 'Livrés payés') THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 END) as avg_delivery_time_hours
      FROM parcels 
      WHERE warehouse_id = $1
    `, [id]);
    
    // Get warehouse users - simplified for now since warehouse_users table might not exist
    const usersResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.phone,
        CASE WHEN u.is_active THEN 'Actif' ELSE 'Inactif' END as status,
        COUNT(p.id) as packages_processed,
        ROUND(AVG(CASE WHEN p.status = 'Livrés' THEN 1 ELSE 0 END) * 100, 1) as performance_percentage
      FROM users u
      LEFT JOIN parcels p ON p.warehouse_id = $1 AND p.shipper_id = u.id
      WHERE u.role = 'Chef d\'agence' OR u.role = 'Membre de l\'agence'
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active
      ORDER BY u.created_at DESC
    `, [id]);
    
    // Get parcels by status for the warehouse
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
    `, [id]);
    
    const statistics = {
      totalPackages: parseInt(statsResult.rows[0]?.total_parcels || 0),
      deliveredToday: parseInt(statsResult.rows[0]?.delivered_today || 0),
      pendingPackages: parseInt(statsResult.rows[0]?.pending_parcels || 0),
      averageDeliveryTime: statsResult.rows[0]?.avg_delivery_time_hours ? 
        `${Math.round(statsResult.rows[0].avg_delivery_time_hours * 10) / 10}h` : '0h',
      monthlyGrowth: '+15%', // This would need more complex calculation
      customerSatisfaction: '4.8/5' // This would need feedback system
    };
    
    res.json({
      success: true,
      data: {
        ...warehouse,
        statistics,
        users: usersResult.rows,
        parcelsByStatus: parcelsByStatusResult.rows
      }
    });
  } catch (error) {
    console.error('Get warehouse details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouse details'
    });
  }
});

// Create new warehouse
router.post('/', async (req, res) => {
  try {
    const { name, governorate, address, manager_id, capacity, status } = req.body;
    
    console.log('🔧 Creating warehouse with manager_id:', manager_id);
    
    // Create the warehouse first
    const warehouseResult = await db.query(`
      INSERT INTO warehouses (name, governorate, address, manager_id, capacity, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, governorate, address, manager_id, capacity || 100, status || 'Actif']);
    
    const warehouse = warehouseResult.rows[0];
    console.log('✅ Warehouse created:', warehouse.name);
    
    // If a manager is assigned, automatically add them to agency_managers table
    if (manager_id) {
      console.log('🔧 Adding manager to agency_managers table...');
      
      try {
        // Get manager details
        const managerResult = await db.query(`
          SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone
          FROM users u
          WHERE u.id = $1
        `, [manager_id]);
        
        if (managerResult.rows.length > 0) {
          const manager = managerResult.rows[0];
          console.log('✅ Manager found:', manager.email);
          
          // Check if manager already exists in agency_managers table
          const existingManagerResult = await db.query(`
            SELECT id FROM agency_managers WHERE email = $1
          `, [manager.email]);
          
          if (existingManagerResult.rows.length === 0) {
            // Add manager to agency_managers table
            await db.query(`
              INSERT INTO agency_managers (name, email, phone, governorate, agency, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, [
              `${manager.first_name} ${manager.last_name}`,
              manager.email,
              manager.phone,
              governorate,
              name
            ]);
            
            console.log('✅ Manager added to agency_managers table');
            console.log(`📍 Governorate: ${governorate}`);
            console.log(`🏢 Agency: ${name}`);
            
            // Also update the users table with agency and governorate
            await db.query(`
              UPDATE users 
              SET agency = $1, governorate = $2, updated_at = NOW()
              WHERE id = $3
            `, [name, governorate, manager_id]);
            
            console.log('✅ Manager updated in users table');
            console.log(`📍 Governorate: ${governorate}`);
            console.log(`🏢 Agency: ${name}`);
          } else {
            // Update existing manager's governorate and agency
            await db.query(`
              UPDATE agency_managers 
              SET governorate = $1, agency = $2, updated_at = NOW()
              WHERE email = $3
            `, [governorate, name, manager.email]);
            
            console.log('✅ Manager updated in agency_managers table');
            console.log(`📍 Governorate: ${governorate}`);
            console.log(`🏢 Agency: ${name}`);
          }
          
          // Also update the users table with agency and governorate
          await db.query(`
            UPDATE users 
            SET agency = $1, governorate = $2, updated_at = NOW()
            WHERE id = $3
          `, [name, governorate, manager_id]);
          
          console.log('✅ Manager updated in users table');
          console.log(`📍 Governorate: ${governorate}`);
          console.log(`🏢 Agency: ${name}`);
        } else {
          console.log('⚠️ Manager not found with ID:', manager_id);
        }
      } catch (managerError) {
        console.error('❌ Error updating agency_managers table:', managerError);
        // Don't fail the warehouse creation if agency_managers update fails
      }
    }
    
    res.json({
      success: true,
      data: warehouse
    });
    
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create warehouse'
    });
  }
});

// Update warehouse
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, governorate, address, manager_id, capacity, status, current_stock } = req.body;
    
    console.log('🔧 Updating warehouse with manager_id:', manager_id);
    
    // Get the old warehouse data to check if manager changed
    const oldWarehouseResult = await db.query(`
      SELECT manager_id FROM warehouses WHERE id = $1
    `, [id]);
    
    const oldManagerId = oldWarehouseResult.rows[0]?.manager_id;
    const managerChanged = oldManagerId !== manager_id;
    
    // Update the warehouse
    const result = await db.query(`
      UPDATE warehouses 
      SET name = $1, governorate = $2, address = $3, manager_id = $4, 
          capacity = $5, status = $6, current_stock = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [name, governorate, address, manager_id, capacity, status, current_stock, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }
    
    const warehouse = result.rows[0];
    console.log('✅ Warehouse updated:', warehouse.name);
    
    // If manager changed and a new manager is assigned, update agency_managers table
    if (managerChanged && manager_id) {
      console.log('🔧 Manager changed, updating agency_managers table...');
      
      try {
        // Get new manager details
        const managerResult = await db.query(`
          SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.phone
          FROM users u
          WHERE u.id = $1
        `, [manager_id]);
        
        if (managerResult.rows.length > 0) {
          const manager = managerResult.rows[0];
          console.log('✅ New manager found:', manager.email);
          
          // Check if manager already exists in agency_managers table
          const existingManagerResult = await db.query(`
            SELECT id FROM agency_managers WHERE email = $1
          `, [manager.email]);
          
          if (existingManagerResult.rows.length === 0) {
            // Add manager to agency_managers table
            await db.query(`
              INSERT INTO agency_managers (name, email, phone, governorate, agency, created_at, updated_at)
              VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, [
              `${manager.first_name} ${manager.last_name}`,
              manager.email,
              manager.phone,
              governorate,
              name
            ]);
            
            console.log('✅ Manager added to agency_managers table');
            console.log(`📍 Governorate: ${governorate}`);
            console.log(`🏢 Agency: ${name}`);
            
            // Also update the users table with agency and governorate
            await db.query(`
              UPDATE users 
              SET agency = $1, governorate = $2, updated_at = NOW()
              WHERE id = $3
            `, [name, governorate, manager_id]);
            
            console.log('✅ Manager updated in users table');
            console.log(`📍 Governorate: ${governorate}`);
            console.log(`🏢 Agency: ${name}`);
          } else {
            // Update existing manager's governorate and agency
            await db.query(`
              UPDATE agency_managers 
              SET governorate = $1, agency = $2, updated_at = NOW()
              WHERE email = $3
            `, [governorate, name, manager.email]);
            
            console.log('✅ Manager updated in agency_managers table');
            console.log(`📍 Governorate: ${governorate}`);
            console.log(`🏢 Agency: ${name}`);
            
            // Also update the users table with agency and governorate
            await db.query(`
              UPDATE users 
              SET agency = $1, governorate = $2, updated_at = NOW()
              WHERE id = $3
            `, [name, governorate, manager_id]);
            
            console.log('✅ Manager updated in users table');
            console.log(`📍 Governorate: ${governorate}`);
            console.log(`🏢 Agency: ${name}`);
          }
        } else {
          console.log('⚠️ New manager not found with ID:', manager_id);
        }
      } catch (managerError) {
        console.error('❌ Error updating agency_managers table:', managerError);
        // Don't fail the warehouse update if agency_managers update fails
      }
    }
    
    res.json({
      success: true,
      data: warehouse
    });
    
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update warehouse'
    });
  }
});

// Delete warehouse
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM warehouses WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete warehouse'
    });
  }
});

// Get warehouse details for Chef d'agence (agency-specific)
router.get('/agency/:agency', async (req, res) => {
  try {
    const { agency } = req.params;
    
    console.log('🔍 Fetching warehouse details for agency:', agency);
    
    // Get warehouse by agency/governorate
    const warehouseResult = await db.query(`
      SELECT 
        w.*,
        COALESCE(NULLIF(CONCAT(u.first_name, ' ', u.last_name), ' '), 'Non assigné') as manager_name,
        COALESCE(u.email, 'Non renseigné') as manager_email,
        COALESCE(u.phone, 'Non renseigné') as manager_phone,
        ROUND(((COALESCE(w.current_stock, 0)::numeric / COALESCE(w.capacity, 100)::numeric) * 100)::numeric, 1) as stock_percentage
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      WHERE w.governorate = $1 OR w.name LIKE $2
      ORDER BY w.created_at DESC
      LIMIT 1
    `, [agency, `%${agency}%`]);
    
    if (warehouseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found for this agency'
      });
    }
    
    const warehouse = warehouseResult.rows[0];
    
    // Get agency-specific statistics
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_parcels,
        COUNT(CASE WHEN status IN ('Livrés', 'Livrés payés') THEN 1 END) as delivered_today,
        COUNT(CASE WHEN status IN ('En attente', 'À enlever', 'Enlevé', 'Au dépôt', 'En cours') THEN 1 END) as pending_parcels,
        AVG(CASE WHEN status IN ('Livrés', 'Livrés payés') THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 END) as avg_delivery_time_hours
      FROM parcels 
      WHERE agency = $1
    `, [agency]);
    
    // Get agency users
    const usersResult = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.phone,
        CASE WHEN u.is_active THEN 'Actif' ELSE 'Inactif' END as status,
        COUNT(p.id) as packages_processed,
        ROUND(AVG(CASE WHEN p.status = 'Livrés' THEN 1 ELSE 0 END) * 100, 1) as performance_percentage
      FROM users u
      LEFT JOIN parcels p ON p.agency = $1 AND p.shipper_id = u.id
      WHERE (u.role = 'Chef d\'agence' OR u.role = 'Membre de l\'agence') 
        AND (u.agency = $1 OR u.governorate = $1)
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active
      ORDER BY u.created_at DESC
    `, [agency]);
    
    // Get parcels by status for the agency
    const parcelsByStatusResult = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM parcels 
      WHERE agency = $1
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
    `, [agency]);
    
    const statistics = {
      totalPackages: parseInt(statsResult.rows[0]?.total_parcels || 0),
      deliveredToday: parseInt(statsResult.rows[0]?.delivered_today || 0),
      pendingPackages: parseInt(statsResult.rows[0]?.pending_parcels || 0),
      averageDeliveryTime: statsResult.rows[0]?.avg_delivery_time_hours ? 
        `${Math.round(statsResult.rows[0].avg_delivery_time_hours * 10) / 10}h` : '0h',
      monthlyGrowth: '+15%',
      customerSatisfaction: '4.8/5'
    };
    
    res.json({
      success: true,
      data: {
        ...warehouse,
        statistics,
        users: usersResult.rows,
        parcelsByStatus: parcelsByStatusResult.rows
      }
    });
  } catch (error) {
    console.error('Get agency warehouse details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agency warehouse details'
    });
  }
});

// Get warehouse statistics for parcels tracking
router.get('/:id/parcels-stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get warehouse details
    const warehouseResult = await db.query(`
      SELECT 
        w.*,
        COALESCE(NULLIF(CONCAT(u.first_name, ' ', u.last_name), ' '), 'Non assigné') as manager_name,
        COALESCE(u.email, 'Non renseigné') as manager_email,
        COALESCE(u.phone, 'Non renseigné') as manager_phone
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      WHERE w.id = $1
    `, [id]);
    
    if (warehouseResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }
    
    const warehouse = warehouseResult.rows[0];
    
    // Get detailed parcel statistics
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_parcels,
        COUNT(CASE WHEN status = 'En attente' THEN 1 END) as pending_parcels,
        COUNT(CASE WHEN status = 'Au dépôt' THEN 1 END) as at_warehouse_parcels,
        COUNT(CASE WHEN status = 'En cours' THEN 1 END) as in_transit_parcels,
        COUNT(CASE WHEN status IN ('Livrés', 'Livrés payés') THEN 1 END) as delivered_parcels,
        COUNT(CASE WHEN status LIKE '%retour%' OR status LIKE '%RTN%' THEN 1 END) as returned_parcels,
        AVG(CASE WHEN status IN ('Livrés', 'Livrés payés') THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 END) as avg_delivery_time_hours,
        COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as parcels_created_today,
        COUNT(CASE WHEN status IN ('Livrés', 'Livrés payés') AND updated_at >= CURRENT_DATE THEN 1 END) as parcels_delivered_today
      FROM parcels 
      WHERE warehouse_id = $1
    `, [id]);
    
    // Get parcels by status breakdown
    const statusBreakdownResult = await db.query(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM parcels WHERE warehouse_id = $1)::numeric) * 100, 1) as percentage
      FROM parcels 
      WHERE warehouse_id = $1
      GROUP BY status
      ORDER BY count DESC
    `, [id]);
    
    // Get recent parcels
    const recentParcelsResult = await db.query(`
      SELECT 
        p.id,
        p.tracking_number,
        p.status,
        p.destination,
        p.created_at,
        s.name as shipper_name,
        s.agency as shipper_agency
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE p.warehouse_id = $1
      ORDER BY p.created_at DESC
      LIMIT 10
    `, [id]);
    
    // Get shippers assigned to this warehouse
    const shippersResult = await db.query(`
      SELECT 
        s.id,
        s.name,
        s.email,
        s.agency,
        COUNT(p.id) as total_parcels,
        COUNT(CASE WHEN p.status IN ('Livrés', 'Livrés payés') THEN 1 END) as delivered_parcels
      FROM shippers s
      LEFT JOIN parcels p ON s.id = p.shipper_id AND p.warehouse_id = $1
      WHERE s.default_warehouse_id = $1
      GROUP BY s.id, s.name, s.email, s.agency
      ORDER BY total_parcels DESC
    `, [id]);
    
    const statistics = {
      warehouse: warehouse,
      overview: {
        totalParcels: parseInt(statsResult.rows[0]?.total_parcels || 0),
        pendingParcels: parseInt(statsResult.rows[0]?.pending_parcels || 0),
        atWarehouseParcels: parseInt(statsResult.rows[0]?.at_warehouse_parcels || 0),
        inTransitParcels: parseInt(statsResult.rows[0]?.in_transit_parcels || 0),
        deliveredParcels: parseInt(statsResult.rows[0]?.delivered_parcels || 0),
        returnedParcels: parseInt(statsResult.rows[0]?.returned_parcels || 0),
        avgDeliveryTimeHours: parseFloat(statsResult.rows[0]?.avg_delivery_time_hours || 0),
        parcelsCreatedToday: parseInt(statsResult.rows[0]?.parcels_created_today || 0),
        parcelsDeliveredToday: parseInt(statsResult.rows[0]?.parcels_delivered_today || 0)
      },
      statusBreakdown: statusBreakdownResult.rows,
      recentParcels: recentParcelsResult.rows,
      assignedShippers: shippersResult.rows
    };
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Get warehouse parcels stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouse parcels statistics'
    });
  }
});

module.exports = router; 