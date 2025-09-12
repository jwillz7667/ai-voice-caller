const fs = require('fs');
const path = require('path');

// Add dynamic export to all API routes
const apiDir = path.join(__dirname, '../app/api');

function addDynamicExport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already has dynamic export
  if (content.includes("export const dynamic")) {
    return false;
  }
  
  // Add after imports
  const importMatch = content.match(/(import[\s\S]*?)\n\n/);
  if (importMatch) {
    content = content.replace(
      importMatch[0], 
      importMatch[0] + "export const dynamic = 'force-dynamic';\n\n"
    );
  } else {
    // Add at the beginning if no clear import section
    content = "export const dynamic = 'force-dynamic';\n\n" + content;
  }
  
  fs.writeFileSync(filePath, content);
  return true;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file === 'route.ts' || file === 'route.js') {
      console.log('Processing:', fullPath);
      if (addDynamicExport(fullPath)) {
        console.log('  ✓ Added dynamic export');
      } else {
        console.log('  - Already has dynamic export');
      }
    }
  });
}

processDirectory(apiDir);
console.log('Done!');