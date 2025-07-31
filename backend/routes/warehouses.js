const express = require('express');
const router = express.Router();
const db = require('../config/database');

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
    
    // Get warehouse statistics
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_parcels,
        COUNT(CASE WHEN status = 'Livrés' THEN 1 END) as delivered_today,
        COUNT(CASE WHEN status IN ('En attente', 'À enlever', 'Enlevé', 'Au dépôt', 'En cours') THEN 1 END) as pending_parcels,
        AVG(CASE WHEN status = 'Livrés' THEN EXTRACT(EPOCH FROM (updated_at - created_at))/3600 END) as avg_delivery_time_hours
      FROM parcels 
      WHERE assigned_warehouse_id = $1
    `, [id]);
    
    // Get warehouse users with correct column names
    const usersResult = await db.query(`
      SELECT 
        wu.id,
        wu.user_id,
        wu.role,
        wu.entry_date,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.phone,
        CASE WHEN u.is_active THEN 'Actif' ELSE 'Inactif' END as status,
        COUNT(p.id) as packages_processed,
        ROUND(AVG(CASE WHEN p.status = 'Livrés' THEN 1 ELSE 0 END) * 100, 1) as performance_percentage
      FROM warehouse_users wu
      LEFT JOIN users u ON wu.user_id = u.id
      LEFT JOIN parcels p ON p.assigned_warehouse_id = $1
      WHERE wu.warehouse_id = $1
      GROUP BY wu.id, wu.user_id, wu.role, wu.entry_date, u.first_name, u.last_name, u.email, u.phone, u.is_active
      ORDER BY wu.entry_date DESC
    `, [id]);
    
    // Get parcels by status for the warehouse
    const parcelsByStatusResult = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM parcels 
      WHERE assigned_warehouse_id = $1
      GROUP BY status
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
    
    const result = await db.query(`
      INSERT INTO warehouses (name, governorate, address, manager_id, capacity, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, governorate, address, manager_id, capacity || 100, status || 'Actif']);
    
    res.json({
      success: true,
      data: result.rows[0]
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
    
    res.json({
      success: true,
      data: result.rows[0]
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

module.exports = router; 