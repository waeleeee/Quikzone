import fs from 'fs';
import path from 'path';

// List of files to fix
const filesToFix = [
  'src/components/dashboard/Secteurs.jsx',
  'src/components/dashboard/Reclamation.jsx',
  'src/components/dashboard/PaimentExpediteur.jsx',
  'src/components/dashboard/MembreAgenceManagement.jsx',
  'src/components/dashboard/MembreAgence.jsx',
  'src/components/dashboard/Livreurs.jsx',
  'src/components/dashboard/Expediteur.jsx',
  'src/components/dashboard/Entrepots.jsx',
  'src/components/dashboard/CommercialProfile.jsx',
  'src/components/dashboard/CommercialPayments.jsx',
  'src/components/dashboard/ColisClient.jsx',
  'src/components/dashboard/Colis.jsx',
  'src/components/dashboard/ClientPayments.jsx',
  'src/components/dashboard/ChefAgence.jsx'
];

function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace header: with label: in column definitions
    const originalContent = content;
    content = content.replace(/header:\s*"/g, 'label: "');
    content = content.replace(/header:\s*'/g, "label: '");
    content = content.replace(/header:\s*`/g, 'label: `');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

console.log('🔧 Fixing table headers in dashboard components...\n');

filesToFix.forEach(fixFile);

console.log('\n✅ All files processed!');
