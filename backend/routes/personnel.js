const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all users for dropdowns
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    
    let query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, r.name as role, u.is_active
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.is_active = true
    `;
    
    const queryParams = [];
    
    if (role) {
      query += ` AND r.name = $1`;
      queryParams.push(role);
    }
    
    query += ` ORDER BY u.first_name, u.last_name`;
    
    const result = await db.query(query, queryParams);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Agency Managers Management - MUST BE BEFORE GENERIC ROUTES
// Get agency managers (users with Chef d'agence role)
router.get('/agency-managers', async (req, res) => {
  console.log('🚀 Agency managers route hit!');
  try {
    console.log('🔍 Agency managers endpoint called');
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('Query params:', { page, limit, search, offset });
    
    let query = `
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.phone,
        u.created_at,
        r.name as role,
        'Siège' as agency,
        'Tunis' as governorate,
        '' as address
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = $1 AND u.is_active = true
    `;
    
    const queryParams = ['Chef d\'agence'];
    
    if (search) {
      query += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $${queryParams.length + 1} OR u.email ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    console.log('Final query:', query);
    console.log('Query params:', queryParams);
    
    const result = await db.query(query, queryParams);
    console.log('Query result rows:', result.rows.length);
    console.log('First row:', result.rows[0]);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) 
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = $1 AND u.is_active = true
    `;
    const countParams = ['Chef d\'agence'];
    
    if (search) {
      countQuery += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $${countParams.length + 1} OR u.email ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    console.log('Total count:', total);
    
    const response = {
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
    
    console.log('Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('Get agency managers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agency managers'
    });
  }
});

// Allowed agencies - All Tunisian governorates
const ALLOWED_AGENCIES = [
  'Siège',
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 
  'Kairouan', 'Kasserine', 'Kébili', 'Kef', 'Mahdia', 'Manouba', 'Médenine', 
  'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine', 
  'Tozeur', 'Tunis', 'Zaghouan'
];

// Create new agency manager (user with Chef d'agence role)
router.post('/agency-managers', async (req, res) => {
  try {
    const { name, email, phone, governorate, address, agency, password } = req.body;
    
    console.log('🔧 Creating agency manager with data:', {
      name,
      email,
      agency,
      agencyType: typeof agency,
      agencyLength: agency?.length,
      hasPassword: !!password,
      passwordLength: password?.length
    });
    console.log('🔧 Full request body:', req.body);

    // Check if user already exists in users table
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password (required for new agency managers)
    if (!password || !password.trim()) {
      console.log('❌ No password provided');
      return res.status(400).json({
        success: false,
        message: 'Password is required for new agency managers'
      });
    }
    
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      console.log('👤 Creating user account:', {
        email,
        firstName,
        lastName,
        phone
      });
      
      const userResult = await client.query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_active, email_verified, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, first_name, last_name, email, phone, created_at
      `, [email, email, hashedPassword, firstName, lastName, phone, true, true, 'Chef d\'agence']);
      
      const userId = userResult.rows[0].id;
      console.log('✅ User account created with ID:', userId);
      
      // Get Chef d'agence role ID
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Chef d\'agence']);
      if (roleResult.rows.length === 0) {
        throw new Error('Chef d\'agence role not found in database');
      }
      const roleId = roleResult.rows[0].id;
      
      // Assign Chef d'agence role to user
      await client.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
        VALUES ($1, $2, $3, $4)
      `, [userId, roleId, userId, true]);
      
      await client.query('COMMIT');
      
      // Return the created user data
      const createdUser = userResult.rows[0];
      createdUser.name = `${createdUser.first_name} ${createdUser.last_name}`.trim();
      createdUser.role = 'Chef d\'agence';
      createdUser.agency = agency || 'Siège';
      createdUser.governorate = governorate || 'Tunis';
      createdUser.address = address || '';
      
      res.status(201).json({
        success: true,
        data: createdUser,
        message: 'Agency manager created successfully with login access'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create agency manager error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create agency manager',
        error: error.message
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create agency manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create agency manager',
      error: error.message
    });
  }
});

// Update agency manager (user with Chef d'agence role)
router.put('/agency-managers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, governorate, address, agency, password } = req.body;
    
    console.log('🔧 Updating agency manager:', {
      id,
      name,
      email,
      agency,
      hasPassword: !!password,
      passwordLength: password?.length
    });
    
    // Check if user exists and has Chef d'agence role
    const userCheck = await db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND r.name = $2 AND u.is_active = true
    `, [id, 'Chef d\'agence']);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agency manager not found or does not have Chef d\'agence role'
      });
    }
    
    const user = userCheck.rows[0];
    
    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Build update query for users table
      let userQuery = `
        UPDATE users 
        SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
      `;
      let userParams = [firstName, lastName, phone];
      
      // Add password update if provided
      if (password && password.trim()) {
        console.log('🔐 Updating password for agency manager');
        const hashedPassword = await bcrypt.hash(password, 10);
        userQuery += `, password_hash = $${userParams.length + 1}`;
        userParams.push(hashedPassword);
      }
      
      userQuery += ` WHERE id = $${userParams.length + 1} RETURNING id, first_name, last_name, email, phone, updated_at`;
      userParams.push(id);
      
      const result = await client.query(userQuery, userParams);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Agency manager not found'
        });
      }
      
      await client.query('COMMIT');
      
      // Return the updated user data
      const updatedUser = result.rows[0];
      updatedUser.name = `${updatedUser.first_name} ${updatedUser.last_name}`.trim();
      updatedUser.role = 'Chef d\'agence';
      updatedUser.agency = agency || 'Siège';
      updatedUser.governorate = governorate || 'Tunis';
      updatedUser.address = address || '';
      
      const message = password && password.trim() 
        ? 'Agency manager updated successfully. Password has been changed and the user can now log in with the new password.'
        : 'Agency manager updated successfully';
        
      res.json({
        success: true,
        data: updatedUser,
        message: message
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update agency manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update agency manager'
    });
  }
});

// Delete agency manager (remove Chef d'agence role from user)
router.delete('/agency-managers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and has Chef d'agence role
    const userCheck = await db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND r.name = $2 AND u.is_active = true
    `, [id, 'Chef d\'agence']);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agency manager not found or does not have Chef d\'agence role'
      });
    }

    // Check if referenced in sectors
    const referenced = await db.query('SELECT id FROM sectors WHERE manager_id = $1', [id]);
    if (referenced.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Impossible de supprimer ce chef d'agence car il est responsable d'un secteur."
      });
    }

    // Get Chef d'agence role ID
    const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['Chef d\'agence']);
    if (roleResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Chef d\'agence role not found in database'
      });
    }
    const roleId = roleResult.rows[0].id;

    // Remove Chef d'agence role from user
    const result = await db.query(`
      DELETE FROM user_roles 
      WHERE user_id = $1 AND role_id = $2
      RETURNING user_id
    `, [id, roleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agency manager role assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Agency manager deleted successfully'
    });
  } catch (error) {
    console.error('Delete agency manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete agency manager'
    });
  }
});

// Agency Members Management - MUST BE BEFORE GENERIC ROUTES
// Get agency members (users with Membre de l'agence role)
router.get('/agency-members', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.phone,
        u.created_at,
        r.name as role,
        COALESCE(am.agency, 'Siège') as agency,
        COALESCE(am.governorate, 'Tunis') as governorate,
        COALESCE(am.address, '') as address,
        'active' as status
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      LEFT JOIN agency_managers am ON u.email = am.email
      WHERE r.name = $1 AND u.is_active = true
    `;
    
    const queryParams = ['Membre de l\'agence'];
    
    // Role-based filtering
    if (req.user?.role === 'Chef d\'agence' || req.user?.role === 'Membre d\'agence') {
      const agencyResult = await db.query(`SELECT agency FROM agency_managers WHERE email = $1`, [req.user.email]);
      if (agencyResult.rows.length > 0) {
        const userAgency = agencyResult.rows[0].agency;
        if (userAgency) {
          query += ` AND am.agency = $${queryParams.length + 1}`;
          queryParams.push(userAgency);
          console.log('🔍 Filtering agency members by agency:', userAgency);
        } else {
          query += ` AND 1=0`; // Show no members if no agency data
        }
      } else {
        query += ` AND 1=0`; // Show no members if no agency manager found
      }
    }
    // Admin users see all agency members (no additional filtering)
    
    if (search) {
      query += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $${queryParams.length + 1} OR u.email ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) 
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = $1 AND u.is_active = true
    `;
    const countParams = ['Membre de l\'agence'];
    
    if (search) {
      countQuery += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $${countParams.length + 1} OR u.email ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get agency members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agency members'
    });
  }
});

// Allowed roles for agency members
const ALLOWED_ROLES = [
  'Magasinier',
  'Agent Débriefing Livreurs',
  'Magasinier de Nuit',
  'Chargé des Opérations Logistiques',
  'Sinior OPS Membre'
];

// Create new agency member (user with Membre de l'agence role)
router.post('/agency-members', async (req, res) => {
  try {
    const { name, email, phone, governorate, address, role, password } = req.body;

    // Get the Chef d'agence's agency automatically
    let userAgency = 'Siège';
    let userGovernorate = 'Tunis';
    
    if (req.user?.role === 'Chef d\'agence') {
      const agencyResult = await db.query(`SELECT agency, governorate FROM agency_managers WHERE email = $1`, [req.user.email]);
      if (agencyResult.rows.length > 0) {
        userAgency = agencyResult.rows[0].agency || 'Siège';
        userGovernorate = agencyResult.rows[0].governorate || 'Tunis';
        console.log('🔍 Using Chef d\'agence agency:', userAgency);
      }
    }

    console.log('🔧 Creating agency member with data:', {
      name,
      email,
      agency: userAgency,
      governorate: userGovernorate,
      role,
      hasPassword: !!password,
      passwordLength: password?.length
    });

    // Check if user already exists in users table
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password (required for new agency members)
    if (!password || !password.trim()) {
      console.log('❌ No password provided');
      return res.status(400).json({
        success: false,
        message: 'Password is required for new agency members'
      });
    }
    
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      console.log('👤 Creating user account:', {
        email,
        firstName,
        lastName,
        phone
      });
      
      const userResult = await client.query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_active, email_verified, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, first_name, last_name, email, phone, created_at
      `, [email, email, hashedPassword, firstName, lastName, phone, true, true, 'Membre de l\'agence']);
      
      const userId = userResult.rows[0].id;
      console.log('✅ User account created with ID:', userId);
      
      // Get Membre de l'agence role ID
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Membre de l\'agence']);
      if (roleResult.rows.length === 0) {
        throw new Error('Membre de l\'agence role not found in database');
      }
      const roleId = roleResult.rows[0].id;
      
      // Assign Membre de l'agence role to user
      await client.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
        VALUES ($1, $2, $3, $4)
      `, [userId, roleId, userId, true]);
      
      await client.query('COMMIT');
      
      // Return the created user data
      const createdUser = userResult.rows[0];
      createdUser.name = `${createdUser.first_name} ${createdUser.last_name}`.trim();
      createdUser.role = 'Membre de l\'agence';
      createdUser.agency = userAgency;
      createdUser.governorate = userGovernorate;
      createdUser.address = address || '';
      createdUser.status = 'active';
      
      res.status(201).json({
        success: true,
        data: createdUser,
        message: 'Agency member created successfully with login access'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create agency member error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create agency member',
        error: error.message
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create agency member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create agency member',
      error: error.message
    });
  }
});

// Update agency member (user with Membre de l'agence role)
router.put('/agency-members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, governorate, address, agency, role, status, password } = req.body;

    console.log('🔧 Updating agency member with data:', {
      id,
      name,
      email,
      agency,
      role,
      hasPassword: !!password,
      passwordLength: password?.length
    });

    // Check if user exists and has Membre de l'agence role
    const userCheck = await db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND r.name = $2 AND u.is_active = true
    `, [id, 'Membre de l\'agence']);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agency member not found or does not have Membre de l\'agence role'
      });
    }
    
    const user = userCheck.rows[0];
    
    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Build update query for users table
      let userQuery = `
        UPDATE users 
        SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
      `;
      let userParams = [firstName, lastName, phone];
      
      // Add password update if provided
      if (password && password.trim()) {
        console.log('🔐 Updating password for agency member');
        const hashedPassword = await bcrypt.hash(password, 10);
        userQuery += `, password_hash = $${userParams.length + 1}`;
        userParams.push(hashedPassword);
      }
      
      userQuery += ` WHERE id = $${userParams.length + 1} RETURNING id, first_name, last_name, email, phone, updated_at`;
      userParams.push(id);
      
      const result = await client.query(userQuery, userParams);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Agency member not found'
        });
      }
      
      await client.query('COMMIT');
      
      // Return the updated user data
      const updatedUser = result.rows[0];
      updatedUser.name = `${updatedUser.first_name} ${updatedUser.last_name}`.trim();
      updatedUser.role = 'Membre de l\'agence';
      updatedUser.agency = agency || 'Siège';
      updatedUser.governorate = governorate || 'Tunis';
      updatedUser.address = address || '';
      updatedUser.status = status || 'active';
      
      const message = password && password.trim() 
        ? 'Agency member updated successfully. Password has been changed and the user can now log in with the new password.'
        : 'Agency member updated successfully';
        
      res.json({
        success: true,
        data: updatedUser,
        message: message
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update agency member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update agency member'
    });
  }
});

// Delete agency member (remove Membre de l'agence role from user)
router.delete('/agency-members/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and has Membre de l'agence role
    const userCheck = await db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND r.name = $2 AND u.is_active = true
    `, [id, 'Membre de l\'agence']);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agency member not found or does not have Membre de l\'agence role'
      });
    }

    // Get Membre de l'agence role ID
    const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['Membre de l\'agence']);
    if (roleResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Membre de l\'agence role not found in database'
      });
    }
    const roleId = roleResult.rows[0].id;

    // Remove Membre de l'agence role from user
    const result = await db.query(`
      DELETE FROM user_roles 
      WHERE user_id = $1 AND role_id = $2
      RETURNING user_id
    `, [id, roleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Agency member role assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Agency member deleted successfully'
    });
  } catch (error) {
    console.error('Delete agency member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete agency member'
    });
  }
});

// Get administrators specifically (users with Administration role)
router.get('/administrators', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.phone,
        u.created_at,
        r.name as role
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Administration' AND u.is_active = true
    `;
    
    const queryParams = [];
    
    if (search) {
      query += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $1 OR u.email ILIKE $1)`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) 
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Administration' AND u.is_active = true
    `;
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $1 OR u.email ILIKE $1)`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get administrators error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch administrators'
    });
  }
});

// Create new administrator (user with Administration role)
router.post('/administrators', async (req, res) => {
  try {
    const { name, email, password, phone, governorate, address, role } = req.body;
    
    // Check if user already exists in users table
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password if provided
    let hashedPassword = null;
    if (password && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Create user in users table
      const userResult = await client.query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_active, email_verified, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, first_name, last_name, email, phone, created_at
      `, [email, email, hashedPassword, firstName, lastName, phone, true, true, 'Administration']);
      
      const userId = userResult.rows[0].id;
      
      // Get role ID for Administration
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Administration']);
      if (roleResult.rows.length === 0) {
        throw new Error('Administration role not found in database');
      }
      
      const roleId = roleResult.rows[0].id;
      
      // Assign role to user
      await client.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
        VALUES ($1, $2, $3, $4)
      `, [userId, roleId, userId, true]);
      
      await client.query('COMMIT');
    
      // Return the created user data
      const createdUser = userResult.rows[0];
      createdUser.name = `${createdUser.first_name} ${createdUser.last_name}`.trim();
      createdUser.role = 'Administration';
      
      res.status(201).json({
        success: true,
        data: createdUser,
        message: 'Administrator created successfully'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Create administrator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create administrator'
    });
  }
});

// Update administrator (user with Administration role)
router.put('/administrators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, phone, governorate, address, role } = req.body;
    
    // Check if user exists and has Administration role
    const existingUser = await db.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND r.name = 'Administration'
    `, [id]);
    
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Administrator not found'
      });
    }
    
    // Hash password if provided
    let hashedPassword = null;
    if (password && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Build update query for users table
      let userQuery, userParams;
      if (hashedPassword) {
        userQuery = `
          UPDATE users 
          SET first_name = $1, last_name = $2, email = $3, password_hash = $4, phone = $5, updated_at = CURRENT_TIMESTAMP
          WHERE id = $6
          RETURNING id, first_name, last_name, email, phone, updated_at
        `;
        userParams = [firstName, lastName, email, hashedPassword, phone, id];
      } else {
        userQuery = `
          UPDATE users 
          SET first_name = $1, last_name = $2, email = $3, phone = $4, updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING id, first_name, last_name, email, phone, updated_at
        `;
        userParams = [firstName, lastName, email, phone, id];
      }
    
      const userResult = await client.query(userQuery, userParams);
      
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      await client.query('COMMIT');
    
      // Return the updated user data
      const updatedUser = userResult.rows[0];
      updatedUser.name = `${updatedUser.first_name} ${updatedUser.last_name}`.trim();
      updatedUser.role = 'Administration';
      
      res.json({
        success: true,
        data: updatedUser,
        message: 'Administrator updated successfully'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update administrator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update administrator'
    });
  }
});

// Delete administrator (user with Administration role)
router.delete('/administrators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists and has Administration role
    const existingUser = await db.query(`
      SELECT u.id
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND r.name = 'Administration'
    `, [id]);
    
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Administrator not found'
      });
    }
    
    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Remove the Administration role from user
      await client.query(`
        DELETE FROM user_roles 
        WHERE user_id = $1 AND role_id = (SELECT id FROM roles WHERE name = 'Administration')
      `, [id]);
      
      // Optionally, you can also deactivate the user instead of deleting
      // await client.query('UPDATE users SET is_active = false WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Administrator role removed successfully'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Delete administrator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete administrator'
    });
  }
});

// Get commercials specifically (users with Commercial role)
router.get('/commercials', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.phone,
        u.created_at,
        r.name as role,
        'Commercial' as title,
        0 as clients_count,
        0 as shipments_received,
        'Tunis' as governorate,
        '' as address
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Commercial' AND u.is_active = true
    `;
    
    const queryParams = [];
    
    if (search) {
      query += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $1 OR u.email ILIKE $1)`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get commercials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commercials'
    });
  }
});

// Create new commercial (user with Commercial role)
router.post('/commercials', async (req, res) => {
  try {
    const { name, email, phone, governorate, address, title, password } = req.body;
    
    // Check if user already exists in users table
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password if provided
    let hashedPassword = null;
    if (password && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Create user in users table
      const userResult = await client.query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_active, email_verified, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, first_name, last_name, email, phone, created_at
      `, [email, email, hashedPassword, firstName, lastName, phone, true, true, 'Commercial']);
      
      const userId = userResult.rows[0].id;
      
      // Get role ID for Commercial
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Commercial']);
      if (roleResult.rows.length === 0) {
        throw new Error('Commercial role not found in database');
      }
      
      const roleId = roleResult.rows[0].id;
      
      // Assign role to user
      await client.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
        VALUES ($1, $2, $3, $4)
      `, [userId, roleId, userId, true]);
      
      await client.query('COMMIT');
    
      // Return the created user data
      const createdUser = userResult.rows[0];
      createdUser.name = `${createdUser.first_name} ${createdUser.last_name}`.trim();
      createdUser.role = 'Commercial';
      createdUser.title = title || 'Commercial';
      createdUser.clients_count = 0;
      createdUser.shipments_received = 0;
      
      res.status(201).json({
        success: true,
        data: createdUser,
        message: 'Commercial created successfully'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Create commercial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create commercial'
    });
  }
});

// Update commercial (user with Commercial role)
router.put('/commercials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, governorate, address, title, password } = req.body;
    
    console.log('🔧 Updating commercial:', {
      id,
      name,
      email,
      hasPassword: !!password,
      passwordLength: password?.length
    });
    
    // Check if user exists and has Commercial role
    const userCheck = await db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND r.name = 'Commercial' AND u.is_active = true
    `, [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commercial not found or does not have Commercial role'
      });
    }
    
    const user = userCheck.rows[0];
    
    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Build update query for users table
      let userQuery = `
        UPDATE users 
        SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
      `;
      let userParams = [firstName, lastName, phone];
      
      // Add password update if provided
      if (password && password.trim()) {
        console.log('🔐 Updating password for commercial');
        const hashedPassword = await bcrypt.hash(password, 10);
        userQuery += `, password_hash = $${userParams.length + 1}`;
        userParams.push(hashedPassword);
      }
      
      userQuery += ` WHERE id = $${userParams.length + 1} RETURNING id, first_name, last_name, email, phone, updated_at`;
      userParams.push(id);
      
      const result = await client.query(userQuery, userParams);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Commercial not found'
        });
      }
      
      await client.query('COMMIT');
      
      // Return the updated user data
      const updatedUser = result.rows[0];
      updatedUser.name = `${updatedUser.first_name} ${updatedUser.last_name}`.trim();
      updatedUser.role = 'Commercial';
      updatedUser.title = title || 'Commercial';
      updatedUser.clients_count = 0;
      updatedUser.shipments_received = 0;
      updatedUser.governorate = governorate || 'Tunis';
      updatedUser.address = address || '';
      
      const message = password && password.trim() 
        ? 'Commercial updated successfully. Password has been changed and the user can now log in with the new password.'
        : 'Commercial updated successfully';
        
      res.json({
        success: true,
        data: updatedUser,
        message: message
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update commercial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update commercial'
    });
  }
});

// Delete commercial (remove Commercial role from user)
router.delete('/commercials/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists and has Commercial role
    const userCheck = await db.query(`
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND r.name = 'Commercial' AND u.is_active = true
    `, [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commercial not found or does not have Commercial role'
      });
    }

    // Get Commercial role ID
    const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['Commercial']);
    if (roleResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Commercial role not found in database'
      });
    }
    const roleId = roleResult.rows[0].id;

    // Remove Commercial role from user
    const result = await db.query(`
      DELETE FROM user_roles 
      WHERE user_id = $1 AND role_id = $2
      RETURNING user_id
    `, [id, roleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commercial role assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Commercial deleted successfully'
    });
  } catch (error) {
    console.error('Delete commercial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete commercial'
    });
  }
});

// Get shippers by commercial ID
router.get('/commercials/:id/shippers', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT id, code, name, email, phone, company, total_parcels, delivered_parcels, returned_parcels, 
             delivery_fees, return_fees, status, siret, fiscal_number, agency, created_at
      FROM shippers 
      WHERE commercial_id = $1
      ORDER BY created_at DESC
    `, [id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get shippers by commercial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shippers for this commercial'
    });
  }
});

// Get payments for shippers of a specific commercial
router.get('/commercials/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        p.*,
        s.name as shipper_name,
        s.email as shipper_email,
        s.phone as shipper_phone,
        s.company as shipper_company
      FROM payments p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE s.commercial_id = $1
    `;
    const queryParams = [id];
    
    if (search) {
      query += ` AND (p.reference ILIKE $2 OR p.payment_method ILIKE $2 OR s.name ILIKE $2)`;
      queryParams.push(`%${search}%`);
    }
    
    if (status) {
      query += ` AND p.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM payments p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE s.commercial_id = $1
    `;
    const countParams = [id];
    
    if (search) {
      countQuery += ` AND (p.reference ILIKE $2 OR p.payment_method ILIKE $2 OR s.name ILIKE $2)`;
      countParams.push(`%${search}%`);
    }
    
    if (status) {
      countQuery += ` AND p.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        payments: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get commercial payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments for this commercial'
    });
  }
});

// Get parcels for shippers of a specific commercial
router.get('/commercials/:id/parcels', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        p.*,
        s.name as shipper_name, 
        s.email as shipper_email,
        s.phone as shipper_phone,
        s.company as shipper_company,
        s.code as shipper_code
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE s.commercial_id = $1
    `;
    const queryParams = [id];
    
    if (search) {
      query += ` AND (p.tracking_number ILIKE $2 OR p.destination ILIKE $2 OR s.name ILIKE $2 OR s.code ILIKE $2)`;
      queryParams.push(`%${search}%`);
    }
    
    if (status) {
      query += ` AND p.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE s.commercial_id = $1
    `;
    const countParams = [id];
    
    if (search) {
      countQuery += ` AND (p.tracking_number ILIKE $2 OR p.destination ILIKE $2 OR s.name ILIKE $2 OR s.code ILIKE $2)`;
      countParams.push(`%${search}%`);
    }
    
    if (status) {
      countQuery += ` AND p.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        parcels: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get commercial parcels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parcels for this commercial'
    });
  }
});

// Get complaints for shippers of a specific commercial
router.get('/commercials/:id/complaints', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        c.*,
        s.name as client_name,
        s.email as client_email,
        s.phone as client_phone,
        u.first_name as assigned_to_name,
        u.last_name as assigned_to_last_name
      FROM complaints c
      LEFT JOIN shippers s ON c.client_id = s.id
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE s.commercial_id = $1
    `;
    const queryParams = [id];
    
    if (search) {
      query += ` AND (c.subject ILIKE $2 OR c.description ILIKE $2 OR s.name ILIKE $2)`;
      queryParams.push(`%${search}%`);
    }
    
    if (status) {
      query += ` AND c.status = $${queryParams.length + 1}`;
      queryParams.push(status);
    }
    
    query += ` ORDER BY c.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) 
      FROM complaints c
      LEFT JOIN shippers s ON c.client_id = s.id
      WHERE s.commercial_id = $1
    `;
    const countParams = [id];
    
    if (search) {
      countQuery += ` AND (c.subject ILIKE $2 OR c.description ILIKE $2 OR s.name ILIKE $2)`;
      countParams.push(`%${search}%`);
    }
    
    if (status) {
      countQuery += ` AND c.status = $${countParams.length + 1}`;
      countParams.push(status);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: {
        complaints: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get commercial complaints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complaints for this commercial'
    });
  }
});

// Get commercial statistics (dashboard data)
router.get('/commercials/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get total shippers count
    const shippersCount = await db.query(`
      SELECT COUNT(*) as count FROM shippers WHERE commercial_id = $1
    `, [id]);
    
    // Get total parcels count
    const parcelsCount = await db.query(`
      SELECT COUNT(*) as count FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE s.commercial_id = $1
    `, [id]);
    
    // Get delivered parcels count
    const deliveredCount = await db.query(`
      SELECT COUNT(*) as count FROM parcels p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE s.commercial_id = $1 AND p.status = 'delivered'
    `, [id]);
    
    // Get total payments amount
    const paymentsAmount = await db.query(`
      SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p
      LEFT JOIN shippers s ON p.shipper_id = s.id
      WHERE s.commercial_id = $1 AND p.status = 'paid'
    `, [id]);
    
    // Get pending complaints count
    const complaintsCount = await db.query(`
      SELECT COUNT(*) as count FROM complaints c
      LEFT JOIN shippers s ON c.client_id = s.id
      WHERE s.commercial_id = $1 AND c.status = 'pending'
    `, [id]);
    
    res.json({
      success: true,
      data: {
        total_shippers: parseInt(shippersCount.rows[0].count),
        total_parcels: parseInt(parcelsCount.rows[0].count),
        delivered_parcels: parseInt(deliveredCount.rows[0].count),
        total_payments: parseFloat(paymentsAmount.rows[0].total),
        pending_complaints: parseInt(complaintsCount.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get commercial stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commercial statistics'
    });
  }
});

// Get accountants specifically (users with Finance role)
router.get('/accountants', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) as name,
        u.email,
        u.phone,
        u.created_at,
        r.name as role,
        'Comptable' as title,
        'Siège' as agency,
        'Tunis' as governorate,
        '' as address
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Finance' AND u.is_active = true
    `;
    
    const queryParams = [];
    
    if (search) {
      query += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $1 OR u.email ILIKE $1)`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) 
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Finance' AND u.is_active = true
    `;
    const countParams = [];
    
    if (search) {
      countQuery += ` AND (CONCAT(u.first_name, ' ', u.last_name) ILIKE $1 OR u.email ILIKE $1)`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get accountants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch accountants'
    });
  }
});

// Create new accountant (user with Finance role)
router.post('/accountants', async (req, res) => {
  try {
    const { name, email, phone, governorate, address, title, agency, password } = req.body;
    
    console.log('🔧 Creating accountant with data:', {
      name,
      email,
      hasPassword: !!password,
      passwordLength: password?.length
    });

    // Check if user already exists in users table
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password (required for new comptables)
    if (!password || !password.trim()) {
      console.log('❌ No password provided');
      return res.status(400).json({
        success: false,
        message: 'Password is required for new comptables'
      });
    }
    
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Split name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      console.log('👤 Creating user account:', {
        email,
        firstName,
        lastName,
        phone
      });
      
      const userResult = await client.query(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, phone, is_active, email_verified, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, first_name, last_name, email, phone, created_at
      `, [email, email, hashedPassword, firstName, lastName, phone, true, true, 'Finance']);
      
      const userId = userResult.rows[0].id;
      console.log('✅ User account created with ID:', userId);
      
      // Get Finance role ID
      const roleResult = await client.query('SELECT id FROM roles WHERE name = $1', ['Finance']);
      if (roleResult.rows.length === 0) {
        throw new Error('Finance role not found in database');
      }
      const roleId = roleResult.rows[0].id;
      
      // Assign Finance role to user
      await client.query(`
        INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
        VALUES ($1, $2, $3, $4)
      `, [userId, roleId, userId, true]);
      
      await client.query('COMMIT');
      
      // Return the created user data
      const createdUser = userResult.rows[0];
      createdUser.name = `${createdUser.first_name} ${createdUser.last_name}`.trim();
      createdUser.role = 'Finance';
      createdUser.title = title || 'Comptable';
      createdUser.agency = agency || 'Siège';
      createdUser.governorate = governorate || 'Tunis';
      createdUser.address = address || '';
      
      res.status(201).json({
        success: true,
        data: createdUser,
        message: 'Accountant created successfully with login access'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create accountant error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create accountant',
        error: error.message
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create accountant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create accountant',
      error: error.message
    });
  }
});

// Update accountant
router.put('/accountants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, governorate, address, title, agency, password } = req.body;
    
    console.log('🔧 Updating accountant:', {
      id,
      name,
      email,
      hasPassword: !!password,
      passwordLength: password?.length
    });
    
    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Build dynamic query for accountants table
      let accountantQuery = `
        UPDATE accountants 
        SET name = $1, email = $2, phone = $3, governorate = $4, address = $5, title = $6, agency = $7, updated_at = CURRENT_TIMESTAMP
      `;
      let accountantParams = [name, email, phone, governorate, address, title, agency];
      
      // Add password update if provided
      if (password && password.trim()) {
        console.log('🔐 Updating password for accountant');
        const hashedPassword = await bcrypt.hash(password, 10);
        accountantQuery += `, password = $${accountantParams.length + 1}`;
        accountantParams.push(hashedPassword);
      } else {
        console.log('⚠️ No password provided for update');
      }
      
      accountantQuery += ` WHERE id = $${accountantParams.length + 1} RETURNING id, name, email, phone, governorate, address, title, agency, updated_at`;
      accountantParams.push(id);
      
      const result = await client.query(accountantQuery, accountantParams);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Accountant not found'
        });
      }
      
      // Update corresponding user account if password is provided
      if (password && password.trim()) {
        console.log('🔐 Updating user account password for:', email);
        const hashedPassword = await bcrypt.hash(password, 10);
        const firstName = name.split(' ')[0] || name;
        const lastName = name.split(' ').slice(1).join(' ') || '';
        
        const userUpdateResult = await client.query(`
          UPDATE users 
          SET first_name = $1, last_name = $2, phone = $3, password_hash = $4, updated_at = CURRENT_TIMESTAMP
          WHERE email = $5
          RETURNING id
        `, [firstName, lastName, phone, hashedPassword, email]);
        
        if (userUpdateResult.rows.length > 0) {
          console.log('✅ User account password updated successfully');
        } else {
          console.log('⚠️ No user account found for email:', email);
        }
      } else {
        // Update user info without password
        const firstName = name.split(' ')[0] || name;
        const lastName = name.split(' ').slice(1).join(' ') || '';
        
        await client.query(`
          UPDATE users 
          SET first_name = $1, last_name = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
          WHERE email = $4
        `, [firstName, lastName, phone, email]);
      }
      
      await client.query('COMMIT');
      
      const message = password && password.trim() 
        ? 'Accountant updated successfully. Password has been changed and the user can now log in with the new password.'
        : 'Accountant updated successfully';
        
      res.json({
        success: true,
        data: result.rows[0],
        message: message
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update accountant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update accountant'
    });
  }
});

// Delete accountant
router.delete('/accountants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      DELETE FROM accountants 
      WHERE id = $1
      RETURNING id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Accountant not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Accountant deleted successfully'
    });
  } catch (error) {
    console.error('Delete accountant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete accountant'
    });
  }
});

// Get drivers specifically
router.get('/livreurs', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT id, name, email, phone, governorate, address, vehicle, status, 
             cin_number, driving_license, car_number, car_type, insurance_number, agency,
             photo_url, personal_documents_url, car_documents_url,
             CASE WHEN password IS NOT NULL THEN true ELSE false END as has_password,
             created_at
      FROM drivers
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Role-based filtering
    if (req.user?.role === 'Chef d\'agence' || req.user?.role === 'Membre d\'agence') {
      const agencyResult = await db.query(`SELECT agency FROM agency_managers WHERE email = $1`, [req.user.email]);
      if (agencyResult.rows.length > 0) {
        const userAgency = agencyResult.rows[0].agency;
        if (userAgency) {
          query += ` AND agency = $${queryParams.length + 1}`;
          queryParams.push(userAgency);
          console.log('🔍 Filtering drivers by agency:', userAgency);
        } else {
          query += ` AND 1=0`; // Show no drivers if no agency data
        }
      } else {
        query += ` AND 1=0`; // Show no drivers if no agency manager found
      }
    } else if (req.user?.role === 'Commercial') {
      // For Commercial users, show drivers from their assigned agency
      const commercialResult = await db.query(`SELECT agency FROM commercials WHERE email = $1`, [req.user.email]);
      if (commercialResult.rows.length > 0) {
        const commercialAgency = commercialResult.rows[0].agency;
        if (commercialAgency) {
          query += ` AND agency = $${queryParams.length + 1}`;
          queryParams.push(commercialAgency);
          console.log('🔍 Filtering drivers by commercial agency:', commercialAgency);
        } else {
          query += ` AND 1=0`;
        }
      } else {
        query += ` AND 1=0`;
      }
    }
    // Admin users see all drivers (no additional filtering)
    
    if (search) {
      query += ` AND (name ILIKE $${queryParams.length + 1} OR email ILIKE $${queryParams.length + 1} OR car_number ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers'
    });
  }
});

// Create new driver
router.post('/livreurs', async (req, res) => {
  try {
    const { 
      name, email, phone, governorate, address, vehicle, status,
      cin_number, driving_license, car_number, car_type, insurance_number, agency,
      photo_url, personal_documents_url, car_documents_url, password
    } = req.body;

    console.log('🔧 Creating driver with data:', {
      name,
      email,
      agency,
      hasPassword: !!password,
      passwordLength: password?.length
    });

    // Check if driver already exists by email
    const existingDriver = await db.query(
      'SELECT id FROM drivers WHERE email = $1',
      [email]
    );
    
    if (existingDriver.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Un livreur avec cet email existe déjà'
      });
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password && password.trim()) {
      console.log('🔐 Hashing password...');
      hashedPassword = await bcrypt.hash(password, 10);
      console.log('✅ Password hashed successfully');
    }

    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Generate unique username
      let username = email.split('@')[0];
      let counter = 1;
      let uniqueUsername = username;
      while (true) {
        const existing = await client.query('SELECT id FROM users WHERE username = $1', [uniqueUsername]);
        if (existing.rows.length === 0) break;
        uniqueUsername = username + counter;
        counter++;
      }
      
      const firstName = name.split(' ')[0] || name;
      const lastName = name.split(' ').slice(1).join(' ') || firstName;
      
      // Create user account if password is provided
      let userId = null;
      if (hashedPassword) {
        const userResult = await client.query(`
          INSERT INTO users (username, email, password_hash, first_name, last_name, role, agency, governorate, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
          RETURNING id
        `, [uniqueUsername, email, hashedPassword, firstName, lastName, 'Livreur', agency, governorate]);
        userId = userResult.rows[0].id;
        
        console.log('✅ User created with role "Livreur"');
      }
      
      // Create driver
      const result = await client.query(`
        INSERT INTO drivers (
          name, email, phone, governorate, address, vehicle, status,
          cin_number, driving_license, car_number, car_type, insurance_number, agency,
          photo_url, personal_documents_url, car_documents_url, password
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id, name, email, phone, governorate, address, vehicle, status,
                  cin_number, driving_license, car_number, car_type, insurance_number, agency,
                  photo_url, personal_documents_url, car_documents_url,
                  CASE WHEN password IS NOT NULL THEN true ELSE false END as has_password,
                  created_at
      `, [
        name, email, phone, governorate, address, vehicle, status || 'Disponible',
        cin_number, driving_license, car_number, car_type, insurance_number, agency,
        photo_url, personal_documents_url, car_documents_url, hashedPassword
      ]);

      await client.query('COMMIT');
      
      console.log('✅ Driver created successfully');
      
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Livreur créé avec succès'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du livreur'
    });
  }
});

// Update driver
router.put('/livreurs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, email, phone, governorate, address, vehicle, status,
      cin_number, driving_license, car_number, car_type, insurance_number, agency,
      photo_url, personal_documents_url, car_documents_url, password
    } = req.body;

    console.log('🔧 Updating driver with data:', {
      id,
      name,
      email,
      agency,
      hasPassword: !!password,
      passwordLength: password?.length
    });

    // First check if the driver exists
    const checkResult = await db.query('SELECT id, email FROM drivers WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livreur non trouvé'
      });
    }

    const currentEmail = checkResult.rows[0].email;
    if (email !== currentEmail) {
      const existingDriver = await db.query('SELECT id FROM drivers WHERE email = $1 AND id != $2', [email, id]);
      if (existingDriver.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Un livreur avec cet email existe déjà'
        });
      }
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password && password.trim()) {
      console.log('🔐 Hashing password...');
      hashedPassword = await bcrypt.hash(password, 10);
      console.log('✅ Password hashed successfully');
    }

    // Start transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Update driver
      let updateQuery = `
        UPDATE drivers 
        SET name = $1, email = $2, phone = $3, governorate = $4, address = $5, 
            vehicle = $6, status = $7, cin_number = $8, driving_license = $9,
            car_number = $10, car_type = $11, insurance_number = $12, agency = $13,
            photo_url = $14, personal_documents_url = $15, car_documents_url = $16,
            updated_at = CURRENT_TIMESTAMP
      `;
      let queryParams = [
        name || null, email || null, phone || null, governorate || null, address || null, 
        vehicle || null, status || null, cin_number || null, driving_license || null,
        car_number || null, car_type || null, insurance_number || null, agency || null,
        photo_url || null, personal_documents_url || null, car_documents_url || null
      ];

      if (hashedPassword) {
        updateQuery += `, password = $${queryParams.length + 1}`;
        queryParams.push(hashedPassword);
      }

      updateQuery += ` WHERE id = $${queryParams.length + 1} RETURNING id, name, email, phone, governorate, address, vehicle, status,
                       cin_number, driving_license, car_number, car_type, insurance_number, agency,
                       photo_url, personal_documents_url, car_documents_url,
                       CASE WHEN password IS NOT NULL THEN true ELSE false END as has_password, updated_at`;
      queryParams.push(id);

      const result = await client.query(updateQuery, queryParams);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Livreur non trouvé'
        });
      }

      // Update user account if password is provided
      if (hashedPassword) {
        const firstName = name.split(' ')[0] || name;
        const lastName = name.split(' ').slice(1).join(' ') || firstName;

        // Check if user exists
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
          // Update existing user
          await client.query(`
            UPDATE users 
            SET password_hash = $1, first_name = $2, last_name = $3, role = $4, agency = $5, governorate = $6, is_active = true
            WHERE email = $7
          `, [hashedPassword, firstName, lastName, 'Livreur', agency, governorate, email]);
          
          console.log('✅ Existing user updated with role "Livreur"');
        } else {
          // Create new user
          let username = email.split('@')[0];
          let counter = 1;
          let uniqueUsername = username;
          while (true) {
            const existing = await client.query('SELECT id FROM users WHERE username = $1', [uniqueUsername]);
            if (existing.rows.length === 0) break;
            uniqueUsername = username + counter;
            counter++;
          }

          const userResult = await client.query(`
            INSERT INTO users (username, email, password_hash, first_name, last_name, role, agency, governorate, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING id
          `, [uniqueUsername, email, hashedPassword, firstName, lastName, 'Livreur', agency, governorate]);

          console.log('✅ User created with role "Livreur" during update');
        }
      }

      await client.query('COMMIT');
      
      console.log('✅ Driver updated successfully');
      
      res.json({
        success: true,
        data: result.rows[0],
        message: 'Livreur mis à jour avec succès'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du livreur: ' + error.message
    });
  }
});

// Delete driver
router.delete('/livreurs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if referenced in pickup missions
    const referenced = await db.query('SELECT id FROM pickup_missions WHERE driver_id = $1', [id]);
    if (referenced.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer ce livreur car il est assigné à des missions de ramassage'
      });
    }

    // Check if referenced in shippers
    const shipperRef = await db.query('SELECT id FROM shippers WHERE default_driver_id = $1', [id]);
    if (shipperRef.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer ce livreur car il est le livreur par défaut d\'un expéditeur'
      });
    }

    const result = await db.query(`
      DELETE FROM drivers 
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Livreur non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Livreur supprimé avec succès'
    });
  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du livreur'
    });
  }
});

// Get commercial's own payments (commissions, salaries, bonuses)
router.get('/commercials/:id/own-payments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('Fetching commercial payments for commercial ID:', id);
    
    // Get commercial's payments from the commercial_payments table
    const paymentsQuery = `
      SELECT id, commercial_id, type, description, amount, payment_method, reference, status, created_at
      FROM commercial_payments 
      WHERE commercial_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM commercial_payments 
      WHERE commercial_id = $1
    `;
    
    const [paymentsResult, countResult] = await Promise.all([
      db.query(paymentsQuery, [id, limit, offset]),
      db.query(countQuery, [id])
    ]);
    
    const payments = paymentsResult.rows;
    const total = parseInt(countResult.rows[0].total);
    
    console.log(`Found ${payments.length} payments for commercial ${id}, total: ${total}`);
    
    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get commercial own payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commercial own payments'
    });
  }
});

// Get commercial payment statistics
router.get('/commercials/:id/payment-stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Fetching commercial payment stats for commercial ID:', id);
    
    // Get commercial payment statistics from commercial_payments table
    const statsQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_amount,
        COUNT(id) as total_payments,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_amount,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COALESCE(SUM(CASE WHEN type = 'Commission' THEN amount ELSE 0 END), 0) as commission_amount,
        COUNT(CASE WHEN type = 'Commission' THEN 1 END) as commission_count,
        COALESCE(SUM(CASE WHEN type = 'Salaire' THEN amount ELSE 0 END), 0) as salary_amount,
        COUNT(CASE WHEN type = 'Salaire' THEN 1 END) as salary_count
      FROM commercial_payments 
      WHERE commercial_id = $1
    `;
    
    const statsResult = await db.query(statsQuery, [id]);
    const stats = statsResult.rows[0];
    
    console.log('Commercial payment stats:', stats);
    
    res.json({
      success: true,
      data: {
        total_amount: parseFloat(stats.total_amount),
        total_payments: parseInt(stats.total_payments),
        paid_amount: parseFloat(stats.paid_amount),
        paid_count: parseInt(stats.paid_count),
        pending_amount: parseFloat(stats.pending_amount),
        pending_count: parseInt(stats.pending_count),
        commission_amount: parseFloat(stats.commission_amount),
        commission_count: parseInt(stats.commission_count),
        salary_amount: parseFloat(stats.salary_amount),
        salary_count: parseInt(stats.salary_count)
      }
    });
  } catch (error) {
    console.error('Get commercial payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch commercial payment statistics'
    });
  }
});

// Create commercial payment
router.post('/commercials/:id/payments', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description, amount, payment_method, reference, status } = req.body;
    
    console.log('Creating commercial payment:', { commercialId: id, paymentData: req.body });
    
    // Validate required fields
    if (!type || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Type, amount, and payment method are required'
      });
    }
    
    // Check if commercial exists
    const commercialCheck = await db.query('SELECT id FROM commercials WHERE id = $1', [id]);
    if (commercialCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commercial not found'
      });
    }
    
    // Insert the payment into commercial_payments table
    // Note: This assumes you have a commercial_payments table
    // If not, you might need to create it or use a different approach
    const result = await db.query(`
      INSERT INTO commercial_payments (commercial_id, type, description, amount, payment_method, reference, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING id, commercial_id, type, description, amount, payment_method, reference, status, created_at
    `, [id, type, description, parseFloat(amount), payment_method, reference || null, status || 'pending']);
    
    console.log('Commercial payment created:', result.rows[0]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Commercial payment created successfully'
    });
  } catch (error) {
    console.error('Create commercial payment error:', error);
    
    // If commercial_payments table doesn't exist, return a helpful error
    if (error.message.includes('relation "commercial_payments" does not exist')) {
      return res.status(500).json({
        success: false,
        message: 'Commercial payments table not set up. Please create the commercial_payments table first.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create commercial payment'
    });
  }
});

// Update commercial payment
router.put('/commercials/:commercialId/payments/:paymentId', async (req, res) => {
  try {
    const { commercialId, paymentId } = req.params;
    const { type, description, amount, payment_method, reference, status } = req.body;
    
    console.log('Updating commercial payment:', { commercialId, paymentId, paymentData: req.body });
    
    // Check if payment exists and belongs to the commercial
    const paymentCheck = await db.query(`
      SELECT id FROM commercial_payments 
      WHERE id = $1 AND commercial_id = $2
    `, [paymentId, commercialId]);
    
    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or does not belong to this commercial'
      });
    }
    
    // Update the payment
    const result = await db.query(`
      UPDATE commercial_payments 
      SET type = $1, description = $2, amount = $3, payment_method = $4, reference = $5, status = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND commercial_id = $8
      RETURNING id, commercial_id, type, description, amount, payment_method, reference, status, updated_at
    `, [type, description, parseFloat(amount), payment_method, reference, status, paymentId, commercialId]);
    
    console.log('Commercial payment updated:', result.rows[0]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Commercial payment updated successfully'
    });
  } catch (error) {
    console.error('Update commercial payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update commercial payment'
    });
  }
});

// Delete commercial payment
router.delete('/commercials/:commercialId/payments/:paymentId', async (req, res) => {
  try {
    const { commercialId, paymentId } = req.params;
    
    console.log('Deleting commercial payment:', { commercialId, paymentId });
    
    // Check if payment exists and belongs to the commercial
    const paymentCheck = await db.query(`
      SELECT id FROM commercial_payments 
      WHERE id = $1 AND commercial_id = $2
    `, [paymentId, commercialId]);
    
    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or does not belong to this commercial'
      });
    }
    
    // Delete the payment
    const result = await db.query(`
      DELETE FROM commercial_payments 
      WHERE id = $1 AND commercial_id = $2
      RETURNING id
    `, [paymentId, commercialId]);
    
    console.log('Commercial payment deleted:', result.rows[0]);
    
    res.json({
      success: true,
      message: 'Commercial payment deleted successfully'
    });
  } catch (error) {
    console.error('Delete commercial payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete commercial payment'
    });
  }
});

// Get all personnel by type
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.is_active, u.created_at
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = $1
    `;
    
    const queryParams = [type];
    
    if (search) {
      query += ` AND (u.username ILIKE $2 OR u.email ILIKE $2 OR u.first_name ILIKE $2 OR u.last_name ILIKE $2)`;
      queryParams.push(`%${search}%`);
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(query, queryParams);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*)
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = $1
    `;
    const countParams = [type];
    
    if (search) {
      countQuery += ` AND (u.username ILIKE $2 OR u.email ILIKE $2 OR u.first_name ILIKE $2 OR u.last_name ILIKE $2)`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get personnel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch personnel data'
    });
  }
});

// Create new personnel
router.post('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { username, email, password, first_name, last_name } = req.body;
    
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create new user
    const result = await db.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, username, email, first_name, last_name, is_active, created_at
    `, [username, email, passwordHash, first_name, last_name]);
    
    // Get role ID for the type
    const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', [type]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role type'
      });
    }
    
    // Assign role to user
    await db.query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
    `, [result.rows[0].id, roleResult.rows[0].id]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: `${type} created successfully`
    });
  } catch (error) {
    console.error('Create personnel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create personnel'
    });
  }
});

// Update personnel
router.put('/:type/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, first_name, last_name, is_active } = req.body;
    
    const result = await db.query(`
      UPDATE users 
      SET username = $1, email = $2, first_name = $3, last_name = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, username, email, first_name, last_name, is_active, updated_at
    `, [username, email, first_name, last_name, is_active, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Personnel not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Personnel updated successfully'
    });
  } catch (error) {
    console.error('Update personnel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update personnel'
    });
  }
});

// Delete personnel
router.delete('/:type/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      DELETE FROM users 
      WHERE id = $1
      RETURNING id
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Personnel not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Personnel deleted successfully'
    });
  } catch (error) {
    console.error('Delete personnel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete personnel'
    });
  }
});

module.exports = router; 