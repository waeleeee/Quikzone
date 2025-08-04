const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    console.log('🔐 authenticateToken middleware called');
    console.log('🔐 Request URL:', req.url);
    console.log('🔐 Request method:', req.method);
    console.log('🔐 Headers:', req.headers);
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔐 Auth header:', authHeader);
    console.log('🔐 Extracted token:', token ? 'Token exists' : 'No token');

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    console.log('🔐 Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 JWT decoded successfully, userId:', decoded.userId);
    
    // Get user with role from users table
    console.log('🔐 Querying user from database...');
    const userResult = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.first_name, u.last_name, 
        u.phone, u.is_active, u.last_login, u.role
      FROM users u
      WHERE u.id = $1 AND u.is_active = true
    `, [decoded.userId]);
    
    console.log('🔐 User query result:', userResult.rows.length, 'users found');

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    const user = userResult.rows[0];
    console.log('✅ User found:', user.email, 'Role:', user.role);
    
    // Set permissions based on role
    user.permissions = getPermissionsByRole(user.role);

    req.user = user;
    console.log('✅ Authentication successful, proceeding to next middleware');
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      console.log('❌ JWT verification failed');
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      console.log('❌ JWT token expired');
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('❌ Unexpected auth error');
    res.status(500).json({ error: 'Authentication error' });
  }
};

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user || !user.permissions) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if user has the required permission
      const hasPermission = checkUserPermission(user.permissions, requiredPermission);
      
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check error' });
    }
  };
};

const checkUserPermission = (permissions, requiredPermission) => {
  // Handle nested permissions (e.g., 'personnel.administration')
  const permissionParts = requiredPermission.split('.');
  let currentLevel = permissions;

  for (const part of permissionParts) {
    if (currentLevel && typeof currentLevel === 'object' && currentLevel[part]) {
      currentLevel = currentLevel[part];
    } else {
      return false;
    }
  }

  return currentLevel === true;
};

// Function to get permissions based on role
const getPermissionsByRole = (role) => {
  const permissions = {
    'Livreur': {
      dashboard: true,
      missions: true,
      pickup_missions: true,
      colis: true,
      reclamation: false
    },
    'Livreurs': {
      dashboard: true,
      missions: true,
      pickup_missions: true,
      colis: true,
      reclamation: false
    },
    'Admin': {
      dashboard: true,
      personnel: { administration: true },
      colis: true,
      missions: true,
      pickup_missions: true,
      reclamation: true,
      shippers: true,
      warehouses: true,
      sectors: true,
      agencies: true,
      payments: true
    },
    'Expéditeur': {
      dashboard: true,
      colis: true,
      paiment_expediteur: true,
      reclamation: true
    },
    'Commercial': {
      dashboard: true,
      colis: true,
      missions: true,
      pickup_missions: true,
      reclamation: true,
      shippers: true
    },
    'Finance': {
      dashboard: true,
      colis: true,
      payments: true,
      reclamation: true
    },
    'Chef d\'agence': {
      dashboard: true,
      colis: true,
      missions: true,
      pickup_missions: true,
      reclamation: true,
      personnel: { administration: true }
    },
    'Membre de l\'agence': {
      dashboard: true,
      colis: true,
      missions: true,
      pickup_missions: true,
      reclamation: true
    }
  };
  
  return permissions[role] || {};
};

module.exports = {
  authenticateToken,
  checkPermission
}; 