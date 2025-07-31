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

async function showDatabaseStructure() {
  try {
    console.log('🔍 QuickZone Database Structure Analysis');
    console.log('==========================================\n');

    // Get all tables
    const tablesQuery = `
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const tablesResult = await pool.query(tablesQuery);
    const tables = tablesResult.rows;

    console.log(`📋 Found ${tables.length} tables in the database:\n`);

    for (const table of tables) {
      console.log(`\n🗄️  Table: ${table.table_name}`);
      console.log('─'.repeat(50));

      // Get table structure
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;

      const columnsResult = await pool.query(columnsQuery, [table.table_name]);
      const columns = columnsResult.rows;

      console.log(`Columns (${columns.length}):`);
      console.log('─'.repeat(80));
      console.log('Column Name'.padEnd(25) + 'Data Type'.padEnd(20) + 'Nullable'.padEnd(10) + 'Default'.padEnd(15) + 'Length/Precision');
      console.log('─'.repeat(80));

      for (const column of columns) {
        const dataType = column.data_type === 'character varying' 
          ? `VARCHAR(${column.character_maximum_length})`
          : column.data_type === 'numeric'
          ? `DECIMAL(${column.numeric_precision},${column.numeric_scale})`
          : column.data_type.toUpperCase();

        const nullable = column.is_nullable === 'YES' ? 'YES' : 'NO';
        const defaultValue = column.column_default || 'NULL';
        const length = column.character_maximum_length || column.numeric_precision || '';

        console.log(
          column.column_name.padEnd(25) +
          dataType.padEnd(20) +
          nullable.padEnd(10) +
          defaultValue.padEnd(15) +
          length
        );
      }

      // Get primary keys
      const primaryKeyQuery = `
        SELECT 
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' 
        AND tc.table_name = $1
        AND tc.table_schema = 'public';
      `;

      const primaryKeyResult = await pool.query(primaryKeyQuery, [table.table_name]);
      const primaryKeys = primaryKeyResult.rows.map(row => row.column_name);

      if (primaryKeys.length > 0) {
        console.log('\n🔑 Primary Key(s):', primaryKeys.join(', '));
      }

      // Get foreign keys
      const foreignKeyQuery = `
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = $1
        AND tc.table_schema = 'public';
      `;

      const foreignKeyResult = await pool.query(foreignKeyQuery, [table.table_name]);
      const foreignKeys = foreignKeyResult.rows;

      if (foreignKeys.length > 0) {
        console.log('\n🔗 Foreign Keys:');
        for (const fk of foreignKeys) {
          console.log(`  ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        }
      }

      // Get indexes
      const indexQuery = `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = $1
        AND schemaname = 'public'
        ORDER BY indexname;
      `;

      const indexResult = await pool.query(indexQuery, [table.table_name]);
      const indexes = indexResult.rows;

      if (indexes.length > 0) {
        console.log('\n📊 Indexes:');
        for (const index of indexes) {
          console.log(`  ${index.indexname}`);
        }
      }

      // Get row count
      const countQuery = `SELECT COUNT(*) as count FROM "${table.table_name}";`;
      try {
        const countResult = await pool.query(countQuery);
        const rowCount = countResult.rows[0].count;
        console.log(`\n📈 Row Count: ${rowCount}`);
      } catch (error) {
        console.log('\n📈 Row Count: Unable to count (table might be empty or have issues)');
      }

      console.log('\n' + '═'.repeat(80));
    }

    // Show table relationships
    console.log('\n🔄 Table Relationships Summary');
    console.log('═'.repeat(80));

    const allForeignKeysQuery = `
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `;

    const allForeignKeysResult = await pool.query(allForeignKeysQuery);
    const allForeignKeys = allForeignKeysResult.rows;

    const relationships = {};
    for (const fk of allForeignKeys) {
      if (!relationships[fk.table_name]) {
        relationships[fk.table_name] = [];
      }
      relationships[fk.table_name].push({
        column: fk.column_name,
        references: `${fk.foreign_table_name}.${fk.foreign_column_name}`
      });
    }

    for (const [tableName, fks] of Object.entries(relationships)) {
      console.log(`\n📋 ${tableName}:`);
      for (const fk of fks) {
        console.log(`  ${fk.column} → ${fk.references}`);
      }
    }

    // Show database statistics
    console.log('\n📊 Database Statistics');
    console.log('═'.repeat(80));

    const statsQuery = `
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY tablename, attname;
    `;

    try {
      const statsResult = await pool.query(statsQuery);
      console.log(`\n📈 Statistics available for ${statsResult.rows.length} columns`);
    } catch (error) {
      console.log('\n📈 Statistics: Unable to retrieve');
    }

    console.log('\n✅ Database structure analysis completed!');

  } catch (error) {
    console.error('❌ Error analyzing database structure:', error);
  } finally {
    await pool.end();
  }
}

// Run the analysis
showDatabaseStructure(); 