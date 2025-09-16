#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Get all TypeScript files
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'dist/**', '.next/**', 'scripts/fix-type-definitions.js']
});

console.log(`Found ${files.length} TypeScript files to process`);

let totalFixes = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Fix NextAuth type definitions
  if (file.includes('next-auth')) {
    // Already using snake_case in the type definitions, so skip
    return;
  }

  // Fix interface definitions that use camelCase
  const interfacePatterns = [
    // User interface fields
    [/\buserId\s*:/g, 'user_id:'],
    [/\bemailVerified\s*:/g, 'email_verified:'],
    [/\btwoFactorEnabled\s*:/g, 'two_factor_enabled:'],
    [/\btwoFactorSecret\s*:/g, 'two_factor_secret:'],
    [/\bcreatedAt\s*:/g, 'created_at:'],
    [/\bupdatedAt\s*:/g, 'updated_at:'],
    [/\blastLoginAt\s*:/g, 'last_login_at:'],
    [/\bavatarUrl\s*:/g, 'avatar_url:'],

    // Session fields
    [/\bsessionToken\s*:/g, 'session_token:'],
    [/\baccessToken\s*:/g, 'access_token:'],
    [/\brefreshToken\s*:/g, 'refresh_token:'],
    [/\btokenType\s*:/g, 'token_type:'],
    [/\bidToken\s*:/g, 'id_token:'],

    // Config fields in types
    [/\bmaxTokens\s*:/g, 'max_tokens:'],
    [/\bmaxOutputTokens\s*:/g, 'max_output_tokens:'],
    [/\bturnDetection\s*:/g, 'turn_detection:'],
    [/\binputAudioFormat\s*:/g, 'input_audio_format:'],
    [/\boutputAudioFormat\s*:/g, 'output_audio_format:'],
    [/\binputAudioTranscription\s*:/g, 'input_audio_transcription:'],

    // Call/Recording fields
    [/\bcallSid\s*:/g, 'call_sid:'],
    [/\brecordingSid\s*:/g, 'recording_sid:'],
    [/\brecordingUrl\s*:/g, 'recording_url:'],
    [/\bcallDuration\s*:/g, 'call_duration:'],
    [/\bstartedAt\s*:/g, 'started_at:'],
    [/\bendedAt\s*:/g, 'ended_at:'],

    // Other common fields
    [/\bentityId\s*:/g, 'entity_id:'],
    [/\bblockUntil\s*:/g, 'blocked_until:'],
    [/\berrorRate\s*:/g, 'error_rate:'],
    [/\blastUsedAt\s*:/g, 'last_used_at:'],
    [/\bisActive\s*:/g, 'is_active:'],
  ];

  // Apply interface field fixes only in type/interface definitions
  interfacePatterns.forEach(([pattern, replacement]) => {
    const interfaceContext = /(interface\s+\w+\s*{[^}]*)/g;
    const typeContext = /(type\s+\w+\s*=\s*{[^}]*)/g;

    // Fix in interface definitions
    content = content.replace(interfaceContext, (match) => {
      if (pattern.test(match)) {
        modified = true;
        totalFixes++;
        return match.replace(pattern, replacement);
      }
      return match;
    });

    // Fix in type definitions
    content = content.replace(typeContext, (match) => {
      if (pattern.test(match)) {
        modified = true;
        totalFixes++;
        return match.replace(pattern, replacement);
      }
      return match;
    });
  });

  // Fix type imports that reference old field names
  if (file.includes('.d.ts')) {
    // Skip declaration files as they're already fixed
    return;
  }

  // Fix function parameter types
  const paramPatterns = [
    [/\(userId:\s*string/g, '(user_id: string'],
    [/\(sessionToken:\s*string/g, '(session_token: string'],
    [/\(callSid:\s*string/g, '(call_sid: string'],
    [/\(recordingSid:\s*string/g, '(recording_sid: string'],
  ];

  paramPatterns.forEach(([pattern, replacement]) => {
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      modified = true;
      totalFixes++;
    }
  });

  // Fix destructuring patterns in function parameters
  const destructurePatterns = [
    [/{\s*userId\s*}/g, '{ user_id }'],
    [/{\s*userId\s*,/g, '{ user_id,'],
    [/,\s*userId\s*}/g, ', user_id }'],
    [/,\s*userId\s*,/g, ', user_id,'],
    [/{\s*sessionToken\s*}/g, '{ session_token }'],
    [/{\s*callSid\s*}/g, '{ call_sid }'],
    [/{\s*recordingSid\s*}/g, '{ recording_sid }'],
  ];

  destructurePatterns.forEach(([pattern, replacement]) => {
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      modified = true;
      totalFixes++;
    }
  });

  // Fix type assertions
  const assertionPatterns = [
    [/as\s*{\s*userId:/g, 'as { user_id:'],
    [/as\s*{\s*sessionToken:/g, 'as { session_token:'],
    [/as\s*{\s*emailVerified:/g, 'as { email_verified:'],
  ];

  assertionPatterns.forEach(([pattern, replacement]) => {
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      modified = true;
      totalFixes++;
    }
  });

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Updated ${file}`);
  }
});

console.log(`\n✅ Total fixes applied: ${totalFixes}`);
console.log('Done!');