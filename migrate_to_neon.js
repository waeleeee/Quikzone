#!/usr/bin/env node

/**
 * Database Migration Script for Neon PostgreSQL
 * This script will help you migrate your local database to Neon
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const LOCAL_DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'quickzone_db',
  user: 'postgres',
  password: 'waelrh' // Update with your local password
};

// You'll need to replace this with your actual Neon connection string
const NEON_CONNECTION_STRING = 'YOUR_NEON_CONNECTION_STRING_HERE';

async function migrateToNeon() {
  console.log('🚀 Starting database migration to Neon...');
  
  try {
    // Step 1: Connect to local database
    console.log('📡 Connecting to local database...');
    const localClient = new Client(LOCAL_DB_CONFIG);
    await localClient.connect();
    console.log('✅ Connected to local database');

    // Step 2: Create clean SQL dump
    console.log('📦 Creating clean SQL dump...');
    const { exec } = require('child_process');
    const dumpCommand = `pg_dump -h localhost -U postgres -d quickzone_db --no-owner --no-acl --clean --if-exists --data-only > quickzone_data_only.sql`;
    
    await new Promise((resolve, reject) => {
      exec(dumpCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error creating dump:', error);
          reject(error);
        } else {
          console.log('✅ SQL dump created successfully');
          resolve();
        }
      });
    });

    // Step 3: Connect to Neon
    console.log('☁️ Connecting to Neon database...');
    const neonClient = new Client({
      connectionString: NEON_CONNECTION_STRING,
      ssl: { rejectUnauthorized: false }
    });
    await neonClient.connect();
    console.log('✅ Connected to Neon database');

    // Step 4: Read and execute the schema from your backup
    console.log('📋 Reading schema from backup...');
    const schemaPath = path.join(__dirname, 'qz.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.includes('CREATE TABLE') || statement.includes('CREATE SEQUENCE') || statement.includes('ALTER TABLE')) {
        try {
          await neonClient.query(statement);
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️ Statement ${i + 1} skipped (already exists)`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
          }
        }
      }
    }

    // Step 5: Copy data
    console.log('📊 Copying data...');
    const dataPath = path.join(__dirname, 'quickzone_data_only.sql');
    if (fs.existsSync(dataPath)) {
      const dataSQL = fs.readFileSync(dataPath, 'utf8');
      const dataStatements = dataSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && stmt.includes('INSERT'));

      for (let i = 0; i < dataStatements.length; i++) {
        const statement = dataStatements[i];
        try {
          await neonClient.query(statement);
          console.log(`✅ Inserted data ${i + 1}/${dataStatements.length}`);
        } catch (error) {
          console.error(`❌ Error inserting data ${i + 1}:`, error.message);
        }
      }
    }

    console.log('🎉 Migration completed successfully!');
    console.log('📋 Next steps:');
    console.log('1. Update your backend environment variables with the Neon connection string');
    console.log('2. Deploy your backend to Render');
    console.log('3. Deploy your frontend to Vercel');
    console.log('4. Update CORS settings to include your Vercel URL');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    if (localClient) await localClient.end();
    if (neonClient) await neonClient.end();
  }
}

// Run migration
if (require.main === module) {
  migrateToNeon();
}

module.exports = { migrateToNeon };
