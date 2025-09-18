const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const personnelRoutes = require('./routes/personnel');
const shippersRoutes = require('./routes/shippers');
const parcelsRoutes = require('./routes/parcels');
const missionsRoutes = require('./routes/missions');
const sectorsRoutes = require('./routes/sectors');
const warehousesRoutes = require('./routes/warehouses');
const paymentsRoutes = require('./routes/payments');
const complaintsRoutes = require('./routes/complaints');
const uploadRoutes = require('./routes/upload');
const missionsPickupRoutes = require('./routes/missionsPickup');
const deliveryMissionsRoutes = require('./routes/deliveryMissions');
const agenciesRoutes = require('./routes/agencies');
const demandsRoutes = require('./routes/demands');
const pickupMissionsRoutes = require('./routes/pickupMissions');
const driversRoutes = require('./routes/drivers');

const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve uploaded files statically (FIRST MIDDLEWARE)
const uploadsPath = path.join(__dirname, 'uploads');
console.log('Uploads directory path:', uploadsPath);
app.use('/uploads', (req, res, next) => {
  console.log('File request:', req.url);
  console.log('Looking for file:', path.join(uploadsPath, req.url));
  next();
}, express.static(uploadsPath));

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Rate limiting - temporarily disabled for development
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
//   message: {
//     error: 'Too many requests from this IP, please try again later.'
//   }
// });
// app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'QuickZone API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Test file access endpoint
app.get('/api/test-file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  const fs = require('fs');
  
  console.log('Testing file access for:', filename);
  console.log('Full file path:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  
  if (fs.existsSync(filePath)) {
    res.json({
      success: true,
      message: 'File exists',
      filename: filename,
      path: filePath
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'File not found',
      filename: filename,
      path: filePath
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/personnel', authenticateToken, personnelRoutes);
app.use('/api/shippers', authenticateToken, shippersRoutes);
app.use('/api/parcels', authenticateToken, parcelsRoutes);
app.use('/api/missions', authenticateToken, missionsRoutes);
app.use('/api/sectors', authenticateToken, sectorsRoutes);
app.use('/api/warehouses', warehousesRoutes);
// Temporarily disable auth for payments routes for testing expediteur payments
app.use('/api/payments', paymentsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/missions-pickup', missionsPickupRoutes);
app.use('/api/delivery-missions', deliveryMissionsRoutes);
app.use('/api/agencies', agenciesRoutes);
app.use('/api/demands', demandsRoutes);
app.use('/api/pickup-missions', pickupMissionsRoutes);
app.use('/api/drivers', driversRoutes);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 QuickZone API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 