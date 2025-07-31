const db = require('../config/database');
const bcrypt = require('bcrypt');

const addSamplePersonnel = async () => {
  try {
    console.log('👥 Adding sample personnel to the database...');

    // First, let's check what roles exist
    const rolesResult = await db.query('SELECT id, name FROM roles');
    console.log('📋 Available roles:', rolesResult.rows.map(r => r.name));

    const samplePersonnel = [
      // Administrators
      {
        username: 'admin1',
        email: 'admin1@quickzone.com',
        password: 'admin123',
        first_name: 'Admin',
        last_name: 'Principal',
        role: 'Administration'
      },
      {
        username: 'admin2',
        email: 'admin2@quickzone.com',
        password: 'admin123',
        first_name: 'Admin',
        last_name: 'Secondaire',
        role: 'Administration'
      },
      // Commercials
      {
        username: 'commercial1',
        email: 'commercial1@quickzone.com',
        password: 'wael123',
        first_name: 'Commercial',
        last_name: 'Tunis',
        role: 'Commercial'
      },
      {
        username: 'commercial2',
        email: 'commercial2@quickzone.com',
        password: 'wael123',
        first_name: 'Commercial',
        last_name: 'Sousse',
        role: 'Commercial'
      },
      {
        username: 'commercial3',
        email: 'commercial3@quickzone.com',
        password: 'wael123',
        first_name: 'Commercial',
        last_name: 'Sfax',
        role: 'Commercial'
      },
      // Agency Managers
      {
        username: 'manager1',
        email: 'manager1@quickzone.com',
        password: 'manager123',
        first_name: 'Manager',
        last_name: 'Tunis',
        role: "Chef d'agence"
      },
      {
        username: 'manager2',
        email: 'manager2@quickzone.com',
        password: 'manager123',
        first_name: 'Manager',
        last_name: 'Sousse',
        role: "Chef d'agence"
      },
      {
        username: 'manager3',
        email: 'manager3@quickzone.com',
        password: 'manager123',
        first_name: 'Manager',
        last_name: 'Sfax',
        role: "Chef d'agence"
      }
    ];

    for (const person of samplePersonnel) {
      try {
        // Check if user already exists
        const existingUser = await db.query(
          'SELECT id FROM users WHERE email = $1 OR username = $2',
          [person.email, person.username]
        );

        if (existingUser.rows.length === 0) {
          // Hash password
          const saltRounds = 10;
          const passwordHash = await bcrypt.hash(person.password, saltRounds);

          // Create user
          const userResult = await db.query(`
            INSERT INTO users (username, email, password_hash, first_name, last_name, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING id, username, email, first_name, last_name
          `, [person.username, person.email, passwordHash, person.first_name, person.last_name]);

          // Get role ID
          const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', [person.role]);
          
          if (roleResult.rows.length > 0) {
            // Assign role to user
            await db.query(`
              INSERT INTO user_roles (user_id, role_id)
              VALUES ($1, $2)
            `, [userResult.rows[0].id, roleResult.rows[0].id]);

            console.log(`✅ Added ${person.role}: ${userResult.rows[0].first_name} ${userResult.rows[0].last_name} (${userResult.rows[0].email})`);
          } else {
            console.log(`⚠️ Role not found: ${person.role}`);
          }
        } else {
          console.log(`⚠️ User already exists: ${person.username} (${person.email})`);
        }
      } catch (error) {
        console.error(`❌ Error adding ${person.role} ${person.username}:`, error.message);
      }
    }

    // Show final counts
    console.log('\n📊 Final counts:');
    
    const adminCount = await db.query(`
      SELECT COUNT(*) FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Administration'
    `);
    console.log(`Administrators: ${adminCount.rows[0].count}`);

    const commercialCount = await db.query(`
      SELECT COUNT(*) FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Commercial'
    `);
    console.log(`Commercials: ${commercialCount.rows[0].count}`);

    const managerCount = await db.query(`
      SELECT COUNT(*) FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Chef d''agence'
    `);
    console.log(`Agency Managers: ${managerCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error adding sample personnel:', error);
  } finally {
    process.exit(0);
  }
};

addSamplePersonnel(); 