#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Get all TypeScript and JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', 'dist/**', '.next/**', 'scripts/fix-all-field-mappings.js']
});

console.log(`Found ${files.length} files to process`);

let totalFixes = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Fix variable declarations and usage
  // Fix: const { user_id } = ... but then using userId
  content = content.replace(/const\s+{\s*user_id\s*}\s*=/g, (match) => {
    modified = true;
    return 'const { user_id: userId } =';
  });

  // Fix where userId is used but user_id is defined
  const hasUserIdDeclaration = /const\s+{\s*user_id(?:\s*:\s*userId)?\s*}/.test(content);
  if (hasUserIdDeclaration) {
    // Replace standalone userId references (not in object literals)
    content = content.replace(/\b(?<![\w.])userId(?!:)\b/g, (match, offset) => {
      // Check if this is not part of an object property definition
      const beforeText = content.substring(Math.max(0, offset - 50), offset);
      const afterText = content.substring(offset, Math.min(content.length, offset + 50));

      if (!beforeText.includes('{') || afterText.includes(':')) {
        return match; // Keep as is if it's an object property
      }
      modified = true;
      return 'user_id';
    });
  }

  // Fix incoming config field mappings
  const configFieldMappings = [
    ['maxTokens', 'max_tokens'],
    ['maxOutputTokens', 'max_output_tokens'],
    ['turnDetection', 'turn_detection'],
    ['inputAudioFormat', 'input_audio_format'],
    ['outputAudioFormat', 'output_audio_format'],
    ['inputAudioTranscription', 'input_audio_transcription'],
    ['enableImages', 'enable_images'],
    ['enableSip', 'enable_sip'],
    ['enableMcp', 'enable_mcp'],
    ['responseMode', 'response_mode'],
    ['noiseReduction', 'noise_reduction'],
    ['echoCancellation', 'echo_cancellation'],
    ['automaticGainControl', 'automatic_gain_control'],
    ['toolChoice', 'tool_choice'],
    ['parallelToolCalls', 'parallel_tool_calls'],
    ['maxResponseOutputTokens', 'max_response_output_tokens'],
    ['conversationId', 'conversation_id'],
    ['vadMode', 'vad_mode'],
    ['sessionId', 'session_id'],
    ['configType', 'config_type'],
    ['audioConfig', 'audio_config'],
    ['inputAudioNoiseReduction', 'input_audio_noise_reduction'],
    ['promptConfig', 'prompt_config'],
    ['recordCall', 'record_call'],
    ['outputAudioGain', 'output_audio_gain']
  ];

  configFieldMappings.forEach(([old, replacement]) => {
    // Fix property access (config.maxTokens -> config.max_tokens)
    const accessRegex = new RegExp(`\\.${old}\\b`, 'g');
    if (content.match(accessRegex)) {
      content = content.replace(accessRegex, `.${replacement}`);
      modified = true;
      totalFixes++;
    }

    // Fix object property definitions
    const propRegex = new RegExp(`\\b${old}:`, 'g');
    if (content.match(propRegex)) {
      content = content.replace(propRegex, `${replacement}:`);
      modified = true;
      totalFixes++;
    }
  });

  // Fix unique constraint names
  content = content.replace(/userId_isActive/g, 'user_id_is_active');
  content = content.replace(/provider_providerAccountId/g, 'provider_provider_account_id');

  // Fix relation names in Prisma queries
  const relationMappings = [
    ['callLog', 'call_logs'],
    ['recording', 'recordings'],
    ['user(?!s|_)', 'users']
  ];

  relationMappings.forEach(([old, replacement]) => {
    // Fix in include/select objects
    const includeRegex = new RegExp(`(include:|select:)\\s*{[^}]*\\b${old}\\b`, 'g');
    if (content.match(includeRegex)) {
      content = content.replace(new RegExp(`\\b${old}:`, 'g'), `${replacement}:`);
      modified = true;
      totalFixes++;
    }
  });

  // Fix where clause field references
  content = content.replace(/where:\s*{\s*callLog:/g, 'where: { call_logs:');
  content = content.replace(/where:\s*{\s*recording:/g, 'where: { recordings:');

  // Fix specific API route issues
  if (file.includes('api/')) {
    // Fix callSid -> call_sid in where clauses
    content = content.replace(/where:\s*{\s*callSid:/g, 'where: { call_sid:');
    content = content.replace(/where:\s*{\s*recordingSid:/g, 'where: { recording_sid:');

    // Fix create data fields
    content = content.replace(/\brecordingSid:/g, 'recording_sid:');
    content = content.replace(/\bcallSid:/g, 'call_sid:');

    // Fix variable reference where userId should be user_id
    content = content.replace(/where:\s*{\s*userId\b/g, 'where: { user_id');
    content = content.replace(/\buserId:(?!\s*['"])/g, 'user_id:');
  }

  // Fix property access in templates
  content = content.replace(/recording\.recordingUrl/g, 'recording.recording_url');
  content = content.replace(/config\.last_used_at/g, 'config.lastUsedAt');

  // Fix navigator.user_agent -> navigator.userAgent
  content = content.replace(/navigator\.user_agent/g, 'navigator.userAgent');

  // Fix startedAt -> started_at
  content = content.replace(/\bstartedAt:/g, 'started_at:');

  // Fix entityId -> entity_id
  content = content.replace(/\bentityId:/g, 'entity_id:');

  // Fix blockedUntil -> blocked_until
  content = content.replace(/\bblockedUntil:/g, 'blocked_until:');

  // Fix errorRate -> error_rate in seed file
  if (file.includes('seed.ts')) {
    content = content.replace(/\berrorRate:/g, 'error_rate:');
    // But then fix the object access back
    content = content.replace(/error_rate:\s*Math/g, 'errorRate: Math');
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Updated ${file}`);
  }
});

console.log(`\n✅ Total fixes applied: ${totalFixes}`);
console.log('Done!');