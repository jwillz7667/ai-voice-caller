#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Get all TypeScript and JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', 'dist/**', '.next/**', 'scripts/**']
});

console.log(`Found ${files.length} files to process`);

let totalFixes = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Fix variable references that need to be updated
  // When we have const { user_id } = ... but code references userId
  const hasUserIdDestructure = /const\s+{\s*user_id(?:\s*:\s*\w+)?\s*}/.test(content);
  const hasSessionTokenDestructure = /const\s+{\s*session_token(?:\s*:\s*\w+)?\s*}/.test(content);
  const hasCallSidDestructure = /const\s+{\s*call_sid(?:\s*:\s*\w+)?\s*}/.test(content);

  // Fix destructuring with renaming where needed
  if (hasUserIdDestructure) {
    // Check if userId is used without being in an object literal context
    const userIdUsages = content.match(/\buserId\b(?!:)/g);
    if (userIdUsages && userIdUsages.length > 0) {
      // Update destructuring to include rename
      content = content.replace(
        /const\s+{\s*user_id\s*}/g,
        'const { user_id: userId }'
      );
      modified = true;
      totalFixes++;
    }
  }

  if (hasSessionTokenDestructure) {
    const sessionTokenUsages = content.match(/\bsessionToken\b(?!:)/g);
    if (sessionTokenUsages && sessionTokenUsages.length > 0) {
      content = content.replace(
        /const\s+{\s*session_token\s*}/g,
        'const { session_token: sessionToken }'
      );
      modified = true;
      totalFixes++;
    }
  }

  if (hasCallSidDestructure) {
    const callSidUsages = content.match(/\bcallSid\b(?!:)/g);
    if (callSidUsages && callSidUsages.length > 0) {
      content = content.replace(
        /const\s+{\s*call_sid\s*}/g,
        'const { call_sid: callSid }'
      );
      modified = true;
      totalFixes++;
    }
  }

  // Fix common variable name mismatches
  const variableFixPatterns = [
    // Fix where we have recordingUrl but need recording_url
    [/\brecordingUrl\b(?!:)/g, 'recording_url'],

    // Fix where we have entityId but need entity_id
    [/\bentityId\b(?!:)/g, 'entity_id'],

    // Fix where we have blockedUntil but need blocked_until
    [/\bblockedUntil\b(?!:)/g, 'blocked_until'],

    // Fix where we have errorRate but need error_rate
    [/\berrorRate\b(?!:)/g, 'error_rate'],
  ];

  variableFixPatterns.forEach(([pattern, replacement]) => {
    // Only fix if it's a variable reference, not a property definition
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      content = content.replace(pattern, replacement);
      modified = true;
      totalFixes++;
    }
  });

  // Remove unused imports
  const importStatements = content.match(/^import\s+(?:{[^}]*}|[\w\s,*]+)\s+from\s+['"][^'"]+['"];?$/gm) || [];

  importStatements.forEach(importStatement => {
    // Extract imported items
    const namedImportMatch = importStatement.match(/import\s+{([^}]+)}/);
    const defaultImportMatch = importStatement.match(/import\s+(\w+)\s+from/);
    const namespaceImportMatch = importStatement.match(/import\s+\*\s+as\s+(\w+)/);

    if (namedImportMatch) {
      const imports = namedImportMatch[1].split(',').map(i => {
        const parts = i.trim().split(/\s+as\s+/);
        return parts[parts.length - 1].trim();
      });

      const unusedImports = imports.filter(imp => {
        // Check if the import is used anywhere in the file (excluding the import statement itself)
        const contentWithoutImport = content.replace(importStatement, '');
        const usagePattern = new RegExp(`\\b${imp}\\b`);
        return !usagePattern.test(contentWithoutImport);
      });

      if (unusedImports.length === imports.length) {
        // Remove entire import statement
        content = content.replace(importStatement + '\n', '');
        modified = true;
        totalFixes++;
      } else if (unusedImports.length > 0) {
        // Remove only unused imports
        let newImportStatement = importStatement;
        unusedImports.forEach(unused => {
          // Remove the unused import (handle various formats)
          newImportStatement = newImportStatement.replace(new RegExp(`\\b${unused}\\s*as\\s*\\w+,?\\s*|\\b${unused},?\\s*`, 'g'), '');
        });
        // Clean up any double commas or trailing commas
        newImportStatement = newImportStatement.replace(/,\s*,/g, ',').replace(/,\s*}/g, ' }').replace(/{\s*,/g, '{ ');

        if (newImportStatement !== importStatement) {
          content = content.replace(importStatement, newImportStatement);
          modified = true;
          totalFixes++;
        }
      }
    }

    if (defaultImportMatch) {
      const importName = defaultImportMatch[1];
      const contentWithoutImport = content.replace(importStatement, '');
      const usagePattern = new RegExp(`\\b${importName}\\b`);
      if (!usagePattern.test(contentWithoutImport)) {
        content = content.replace(importStatement + '\n', '');
        modified = true;
        totalFixes++;
      }
    }
  });

  // Remove unused variables (const/let/var that are never referenced)
  const variableDeclarations = content.match(/(?:const|let|var)\s+(\w+)\s*=/g) || [];

  variableDeclarations.forEach(declaration => {
    const varNameMatch = declaration.match(/(?:const|let|var)\s+(\w+)/);
    if (varNameMatch) {
      const varName = varNameMatch[1];
      // Count occurrences (should be at least 2 - declaration + usage)
      const occurrences = (content.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
      if (occurrences === 1) {
        // Find the full declaration line and remove it
        const lines = content.split('\n');
        const lineIndex = lines.findIndex(line => line.includes(declaration));
        if (lineIndex >= 0) {
          // Check if it's a simple single-line declaration
          if (lines[lineIndex].trim().startsWith(declaration.trim())) {
            lines.splice(lineIndex, 1);
            content = lines.join('\n');
            modified = true;
            totalFixes++;
          }
        }
      }
    }
  });

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Updated ${file}`);
  }
});

console.log(`\n✅ Total fixes applied: ${totalFixes}`);
console.log('Done!');