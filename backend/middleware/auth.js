const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user with roles
    const userResult = await db.query(`
      SELECT 
        u.id, u.username, u.email, u.first_name, u.last_name, 
        u.phone, u.is_active, u.last_login,
        r.name as role, r.permissions
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND u.is_active = true AND ur.is_active = true
    `, [decoded.userId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token or user not found' });
    }

    const user = userResult.rows[0];
    user.permissions = typeof user.permissions === 'string' 
      ? JSON.parse(user.permissions) 
      : user.permissions;

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
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

module.exports = {
  authenticateToken,
  checkPermission
}; 