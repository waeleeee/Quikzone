const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all sectors with manager name
router.get('/', async (req, res) => {
  try {
    console.log('🚀 Sectors route hit!');
    const result = await db.query(`
      SELECT s.*, am.name AS manager_name
      FROM sectors s
      LEFT JOIN agency_managers am ON s.manager_id = am.id
      ORDER BY s.created_at DESC
    `);
    console.log('✅ Sectors query result:', result.rows);
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get sectors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sectors'
    });
  }
});

// Create new sector
router.post('/', async (req, res) => {
  try {
    const { name, city, manager_id, status } = req.body;
    const result = await db.query(
      `INSERT INTO sectors (name, city, manager_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [name, city, manager_id, status]
    );
    // Get manager name
    const manager = manager_id ? await db.query('SELECT name FROM agency_managers WHERE id = $1', [manager_id]) : null;
    const manager_name = manager && manager.rows[0] ? manager.rows[0].name : null;
    res.status(201).json({
      success: true,
      data: { ...result.rows[0], manager_name },
      message: 'Sector created successfully'
    });
  } catch (error) {
    console.error('Create sector error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sector'
    });
  }
});

// Update sector
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city, manager_id, status } = req.body;
    const result = await db.query(
      `UPDATE sectors SET name = $1, city = $2, manager_id = $3, status = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, city, manager_id, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sector not found' });
    }
    const manager = manager_id ? await db.query('SELECT name FROM agency_managers WHERE id = $1', [manager_id]) : null;
    const manager_name = manager && manager.rows[0] ? manager.rows[0].name : null;
    res.json({
      success: true,
      data: { ...result.rows[0], manager_name },
      message: 'Sector updated successfully'
    });
  } catch (error) {
    console.error('Update sector error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sector'
    });
  }
});

// Delete sector
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM sectors WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sector not found' });
    }
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Sector deleted successfully'
    });
  } catch (error) {
    console.error('Delete sector error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sector'
    });
  }
});

module.exports = router; 