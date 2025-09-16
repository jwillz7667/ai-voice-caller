#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const replacements = {
  'prisma.userss': 'prisma.users',
  'prisma.sessionss': 'prisma.sessions',
  'prisma.notificationss': 'prisma.notifications',
  'prisma.accountss': 'prisma.accounts',
  'prisma.recordingss': 'prisma.recordings',
};

// Get all TypeScript and JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', 'dist/**', '.next/**', 'scripts/fix-double-s.js']
});

console.log(`Found ${files.length} files to process`);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Replace double 's' errors
  Object.entries(replacements).forEach(([old, replacement]) => {
    const regex = new RegExp(old.replace('.', '\\.'), 'g');
    if (content.match(regex)) {
      content = content.replace(regex, replacement);
      modified = true;
      console.log(`  Fixed ${old} -> ${replacement} in ${file}`);
    }
  });

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Updated ${file}`);
  }
});

console.log('Done!');