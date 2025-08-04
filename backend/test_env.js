require('dotenv').config({ path: './config.env' });

console.log('🔍 Testing environment configuration...');
console.log('🔍 JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('🔍 JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 PORT:', process.env.PORT);

// Test JWT functionality
const jwt = require('jsonwebtoken');

try {
  const testToken = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('✅ JWT signing works');
  
  const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
  console.log('✅ JWT verification works');
  console.log('✅ Decoded token:', decoded);
} catch (error) {
  console.error('❌ JWT test failed:', error);
} 