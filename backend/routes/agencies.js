const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all agency names from agency_managers table
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT agency FROM agency_managers WHERE agency IS NOT NULL AND agency != \'\' ORDER BY agency');
    const agencies = result.rows.map(row => ({
      id: row.agency, // Use agency name as ID
      name: row.agency
    }));
    res.json(agencies);
  } catch (error) {
    console.error('Get agencies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch agencies' });
  }
});

module.exports = router; 