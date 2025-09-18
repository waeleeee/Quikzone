const bcrypt = require('bcryptjs');

const testPasswordHash = async () => {
  try {
    console.log('🔍 Testing password hash...\n');

    const passwordHash = '$2a$10$sKkoYY07TvNUlgnsfkKuce7oMu7fJVWLO20F9tOVbPN/kNw7KSqJu';
    
    // Test common passwords
    const testPasswords = [
      '123456',
      'password',
      'admin',
      '12345678',
      'qwerty',
      '123456789',
      '12345',
      '1234',
      '111111',
      '1234567',
      'dragon',
      '123123',
      'baseball',
      'abc123',
      'football',
      'monkey',
      'letmein',
      'shadow',
      'master',
      '666666',
      'qwertyuiop',
      '123321',
      'mustang',
      '1234567890',
      'michael',
      '654321',
      'superman',
      '1qaz2wsx',
      '7777777',
      '121212',
      '000000',
      'qazwsx',
      '123qwe',
      'killer',
      'trustno1',
      'jordan',
      'jennifer',
      'zxcvbnm',
      'asdfgh',
      'hunter',
      'buster',
      'soccer',
      'harley',
      'batman',
      'andrew',
      'tigger',
      'sunshine',
      'iloveyou',
      '2000',
      'charlie',
      'robert',
      'thomas',
      'hockey',
      'ranger',
      'daniel',
      'starwars',
      'klaster',
      '112233',
      'george',
      'computer',
      'michelle',
      'jessica',
      'pepper',
      '1111',
      'zxcvbn',
      '555555',
      '11111111',
      '131313',
      'freedom',
      '777777',
      'pass',
      'maggie',
      '159753',
      'aaaaaa',
      'ginger',
      'princess',
      'joshua',
      'cheese',
      'amanda',
      'summer',
      'love',
      'ashley',
      'nicole',
      'chelsea',
      'biteme',
      'matthew',
      'access',
      'yankees',
      '987654321',
      'dallas',
      'austin',
      'thunder',
      'taylor',
      'matrix',
      'mobilemail',
      'mom',
      'monitor',
      'monitoring',
      'montana',
      'moon',
      'moscow'
    ];
    
    console.log('📋 Testing passwords...');
    for (const testPassword of testPasswords) {
      const isMatch = await bcrypt.compare(testPassword, passwordHash);
      if (isMatch) {
        console.log(`✅ MATCH FOUND! Password is: "${testPassword}"`);
        return;
      }
    }
    
    console.log('❌ No match found with common passwords');
    console.log('📋 Trying to generate a new password hash for "123456"...');
    
    const newHash = await bcrypt.hash('123456', 10);
    console.log(`✅ New hash for "123456": ${newHash}`);
    
  } catch (error) {
    console.error('❌ Error testing password hash:', error);
  }
};

testPasswordHash(); 