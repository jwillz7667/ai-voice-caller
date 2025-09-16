#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Get all TypeScript and JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', 'dist/**', '.next/**', 'scripts/fix-required-fields.js']
});

console.log(`Found ${files.length} files to process`);

let totalFixes = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Fix Prisma create operations to include required fields
  // Pattern: prisma.*.create({ data: { ... } })
  const createPattern = /prisma\.([\w_]+)\.create\s*\(\s*{\s*data:\s*{([^}]+)}/g;

  content = content.replace(createPattern, (match, tableName, dataContent) => {
    // Check if it already has id field
    if (!/\bid\s*:/.test(dataContent)) {
      // Check if crypto is imported
      if (!content.includes('import crypto') && !content.includes('require("crypto")')) {
        // Add crypto import at the top of the file
        if (content.includes('import ')) {
          content = `import crypto from 'crypto';\n` + content;
        } else if (content.includes('require(')) {
          content = `const crypto = require('crypto');\n` + content;
        }
      }

      // Add required fields if they don't exist
      let newDataContent = dataContent;

      // Add id if not present
      if (!/\bid\s*:/.test(dataContent)) {
        newDataContent = `\n        id: crypto.randomUUID(),${newDataContent}`;
        modified = true;
        totalFixes++;
      }

      // Add created_at if not present and not already there
      if (!/\bcreated_at\s*:/.test(dataContent) && !/\bcreatedAt\s*:/.test(dataContent)) {
        newDataContent = `${newDataContent.trimEnd()},\n        created_at: new Date()`;
        modified = true;
        totalFixes++;
      }

      // Add updated_at if not present and not already there
      if (!/\bupdated_at\s*:/.test(dataContent) && !/\bupdatedAt\s*:/.test(dataContent)) {
        newDataContent = `${newDataContent.trimEnd()},\n        updated_at: new Date()`;
        modified = true;
        totalFixes++;
      }

      return `prisma.${tableName}.create({ data: {${newDataContent}\n      }`;
    }
    return match;
  });

  // Fix createMany operations
  const createManyPattern = /prisma\.([\w_]+)\.createMany\s*\(\s*{\s*data:\s*\[([^\]]+)\]/g;

  content = content.replace(createManyPattern, (match, tableName, dataContent) => {
    if (!/\bid\s*:/.test(dataContent)) {
      // Add crypto import if needed
      if (!content.includes('import crypto') && !content.includes('require("crypto")')) {
        if (content.includes('import ')) {
          content = `import crypto from 'crypto';\n` + content;
        } else if (content.includes('require(')) {
          content = `const crypto = require('crypto');\n` + content;
        }
      }

      // Process each object in the array
      let newDataContent = dataContent.replace(/\{([^}]+)\}/g, (objMatch, objContent) => {
        let newObjContent = objContent;

        // Add required fields if missing
        if (!/\bid\s*:/.test(objContent)) {
          newObjContent = `\n          id: crypto.randomUUID(),${newObjContent}`;
          modified = true;
          totalFixes++;
        }

        if (!/\bcreated_at\s*:/.test(objContent) && !/\bcreatedAt\s*:/.test(objContent)) {
          newObjContent = `${newObjContent.trimEnd()},\n          created_at: new Date()`;
          modified = true;
          totalFixes++;
        }

        if (!/\bupdated_at\s*:/.test(objContent) && !/\bupdatedAt\s*:/.test(objContent)) {
          newObjContent = `${newObjContent.trimEnd()},\n          updated_at: new Date()`;
          modified = true;
          totalFixes++;
        }

        return `{${newObjContent}\n        }`;
      });

      return `prisma.${tableName}.createMany({ data: [${newDataContent}]`;
    }
    return match;
  });

  // Fix upsert operations - need to add fields to create block
  const upsertPattern = /prisma\.([\w_]+)\.upsert\s*\(\s*{[^}]*create:\s*{([^}]+)}/g;

  content = content.replace(upsertPattern, (match, tableName, createContent) => {
    if (!/\bid\s*:/.test(createContent)) {
      // Add crypto import if needed
      if (!content.includes('import crypto') && !content.includes('require("crypto")')) {
        if (content.includes('import ')) {
          content = `import crypto from 'crypto';\n` + content;
        } else if (content.includes('require(')) {
          content = `const crypto = require('crypto');\n` + content;
        }
      }

      let newCreateContent = createContent;

      // Add required fields if missing
      if (!/\bid\s*:/.test(createContent)) {
        newCreateContent = `\n        id: crypto.randomUUID(),${newCreateContent}`;
        modified = true;
        totalFixes++;
      }

      if (!/\bcreated_at\s*:/.test(createContent) && !/\bcreatedAt\s*:/.test(createContent)) {
        newCreateContent = `${newCreateContent.trimEnd()},\n        created_at: new Date()`;
        modified = true;
        totalFixes++;
      }

      if (!/\bupdated_at\s*:/.test(createContent) && !/\bupdatedAt\s*:/.test(createContent)) {
        newCreateContent = `${newCreateContent.trimEnd()},\n        updated_at: new Date()`;
        modified = true;
        totalFixes++;
      }

      return match.replace(/create:\s*{[^}]+}/, `create: {${newCreateContent}\n      }`);
    }
    return match;
  });

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Updated ${file}`);
  }
});

console.log(`\n✅ Total fixes applied: ${totalFixes}`);
console.log('Done!');