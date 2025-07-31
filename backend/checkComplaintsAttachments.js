const db = require('./config/database');

async function checkAndAddAttachmentColumns() {
  try {
    console.log('🔍 Checking complaints table for attachment columns...');
    
    // Check current columns
    const columnsResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'complaints' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Current complaints table columns:');
    columnsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name} (${row.data_type})`);
    });
    
    // Check if attachments column exists
    const hasAttachments = columnsResult.rows.some(row => row.column_name === 'attachments');
    
    if (!hasAttachments) {
      console.log('➕ Adding attachments column to complaints table...');
      
      await db.query(`
        ALTER TABLE complaints 
        ADD COLUMN attachments TEXT[]
      `);
      
      console.log('✅ Attachments column added successfully!');
    } else {
      console.log('✅ Attachments column already exists!');
    }
    
    // Check if attachment_names column exists
    const hasAttachmentNames = columnsResult.rows.some(row => row.column_name === 'attachment_names');
    
    if (!hasAttachmentNames) {
      console.log('➕ Adding attachment_names column to complaints table...');
      
      await db.query(`
        ALTER TABLE complaints 
        ADD COLUMN attachment_names TEXT[]
      `);
      
      console.log('✅ Attachment_names column added successfully!');
    } else {
      console.log('✅ Attachment_names column already exists!');
    }
    
    // Show final table structure
    const finalColumnsResult = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'complaints' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Final complaints table columns:');
    finalColumnsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name} (${row.data_type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

checkAndAddAttachmentColumns(); 