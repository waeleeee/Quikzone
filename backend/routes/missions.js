const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all missions
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT pm.*, d.first_name as driver_name, s.name as shipper_name
      FROM pickup_missions pm
      LEFT JOIN users d ON pm.driver_id = d.id
      LEFT JOIN shippers s ON pm.shipper_id = s.id
      ORDER BY pm.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get missions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch missions'
    });
  }
});

// Create new mission
router.post('/', async (req, res) => {
  try {
    const { mission_number, driver_id, shipper_id, scheduled_date, status } = req.body;
    
    const result = await db.query(`
      INSERT INTO pickup_missions (mission_number, driver_id, shipper_id, scheduled_date, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [mission_number, driver_id, shipper_id, scheduled_date, status]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Mission created successfully'
    });
  } catch (error) {
    console.error('Create mission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mission'
    });
  }
});

module.exports = router; 