const { Pool } = require('pg');
require('dotenv').config({ path: './backend/config.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'quickzone_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'waelrh',
  ssl: false
});

async function showTablesSimple() {
  try {
    console.log('🗄️  QuickZone Database Tables');
    console.log('==============================\n');

    // Get all tables
    const tablesQuery = `
      SELECT 
        table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows;

    console.log(`📋 Total Tables: ${tables.length}\n`);

    for (const table of tables) {
      console.log(`\n📦 Table: ${table.table_name}`);
      console.log('─'.repeat(40));

      // Get basic column info
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;

      const columnsResult = await pool.query(columnsQuery, [table.table_name]);
      const columns = columnsResult.rows;

      console.log(`Columns (${columns.length}):`);
      for (const column of columns) {
        const dataType = column.data_type === 'character varying' 
          ? 'VARCHAR'
          : column.data_type === 'numeric'
          ? 'DECIMAL'
          : column.data_type.toUpperCase();

        const nullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultValue = column.column_default ? `DEFAULT ${column.column_default}` : '';

        console.log(`  • ${column.column_name}: ${dataType} ${nullable} ${defaultValue}`.trim());
      }

      // Get row count
      const countQuery = `SELECT COUNT(*) as count FROM "${table.table_name}";`;
      try {
        const countResult = await pool.query(countQuery);
        const rowCount = countResult.rows[0].count;
        console.log(`  📊 Records: ${rowCount}`);
      } catch (error) {
        console.log(`  📊 Records: Unable to count`);
      }
    }

    console.log('\n✅ Database tables overview completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

// Run the analysis
showTablesSimple(); 