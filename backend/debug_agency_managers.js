const db = require('./config/database');

async function debugAgencyManagers() {
  try {
    console.log('🔍 Debugging agency managers query...');
    
    // Test 1: Simple query without pagination
    console.log('\n1. Testing simple query:');
    const simpleResult = await db.query('SELECT * FROM agency_managers');
    console.log('Simple query result:', simpleResult.rows.length, 'records');
    console.log('First record:', simpleResult.rows[0]);
    
    // Test 2: Query with pagination (like the API)
    console.log('\n2. Testing paginated query:');
    const page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT id, name, email, phone, governorate, address, agency, created_at
      FROM agency_managers
      WHERE 1=1
    `;
    
    const queryParams = [];
    query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);
    
    console.log('Query:', query);
    console.log('Params:', queryParams);
    
    const paginatedResult = await db.query(query, queryParams);
    console.log('Paginated query result:', paginatedResult.rows.length, 'records');
    console.log('First record:', paginatedResult.rows[0]);
    
    // Test 3: Count query
    console.log('\n3. Testing count query:');
    const countResult = await db.query('SELECT COUNT(*) FROM agency_managers');
    console.log('Total count:', countResult.rows[0].count);
    
    await db.pool.end();
  } catch (error) {
    console.error('❌ Debug error:', error);
    await db.pool.end();
  }
}

debugAgencyManagers(); 