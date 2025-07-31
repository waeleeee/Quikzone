const { Pool } = require('pg');
const dbConfig = require('../config/database');

const pool = new Pool(dbConfig);

const createTableQuery = `
CREATE TABLE IF NOT EXISTS missions_pickup (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
  shipper_id INTEGER REFERENCES shippers(id) ON DELETE SET NULL,
  colis_ids INTEGER[] NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  status TEXT NOT NULL DEFAULT 'En attente',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

(async () => {
  try {
    await pool.query(createTableQuery);
    console.log('✅ Table missions_pickup créée ou déjà existante.');
  } catch (err) {
    console.error('Erreur lors de la création de la table missions_pickup:', err);
  } finally {
    await pool.end();
  }
})(); 