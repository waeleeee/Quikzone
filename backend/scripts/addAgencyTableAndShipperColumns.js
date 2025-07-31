const db = require('../config/database');

async function migrate() {
  try {
    // 1. Create agencies table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS agencies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        address TEXT,
        governorate VARCHAR(50),
        status VARCHAR(20) DEFAULT 'Actif',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ agencies table ensured');

    // 2. Seed agencies if empty
    const { rows: agencyRows } = await db.query('SELECT COUNT(*) FROM agencies');
    if (parseInt(agencyRows[0].count) === 0) {
      await db.query(`
        INSERT INTO agencies (name, address, governorate) VALUES
        ('Agence Tunis', 'Adresse Tunis', 'Tunis'),
        ('Agence Sousse', 'Adresse Sousse', 'Sousse'),
        ('Agence Sfax', 'Adresse Sfax', 'Sfax')
      `);
      console.log('✅ Seeded agencies');
    }

    // 3. Add agency_id and new columns to shippers
    await db.query(`
      ALTER TABLE shippers
        ADD COLUMN IF NOT EXISTS agency_id INTEGER,
        ADD COLUMN IF NOT EXISTS password VARCHAR(255),
        ADD COLUMN IF NOT EXISTS identity_number VARCHAR(30),
        ADD COLUMN IF NOT EXISTS id_document VARCHAR(255),
        ADD COLUMN IF NOT EXISTS company_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS company_address TEXT,
        ADD COLUMN IF NOT EXISTS company_governorate VARCHAR(50),
        ADD COLUMN IF NOT EXISTS company_documents VARCHAR(255)
    `);
    console.log('✅ Added new columns to shippers');

    // 4. Add foreign key constraint for agency_id
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_shippers_agency_id') THEN
          ALTER TABLE shippers
            ADD CONSTRAINT fk_shippers_agency_id FOREIGN KEY (agency_id) REFERENCES agencies(id);
        END IF;
      END $$;
    `);
    console.log('✅ Foreign key constraint added for shippers.agency_id');

    console.log('🎉 Migration completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate(); 