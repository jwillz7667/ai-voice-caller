#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Mapping of old camelCase to new snake_case
const replacements = {
  'prisma.user': 'prisma.users',
  'prisma.account': 'prisma.accounts',
  'prisma.session': 'prisma.sessions',
  'prisma.emailVerification': 'prisma.email_verifications',
  'prisma.passwordReset': 'prisma.password_resets',
  'prisma.notification': 'prisma.notifications',
  'prisma.callLog': 'prisma.call_logs',
  'prisma.recording': 'prisma.recordings',
  'prisma.creditTransaction': 'prisma.credit_transactions',
  'prisma.savedConfiguration': 'prisma.saved_configurations',
  'prisma.incomingCallConfig': 'prisma.incoming_call_configs',
  'prisma.realtimeSession': 'prisma.realtime_sessions',
  'prisma.auditLog': 'prisma.audit_logs',
  'prisma.rateLimit': 'prisma.rate_limits',
  'prisma.systemHealth': 'prisma.system_health',
  'prisma.apiKey': 'prisma.api_keys',
  'prisma.webhook': 'prisma.webhooks',
  'prisma.webhookLog': 'prisma.webhook_logs',
  'prisma.analytics': 'prisma.analytics',
  'prisma.organization': 'prisma.organizations',
  'prisma.organizationMember': 'prisma.organization_members',
  'prisma.invite': 'prisma.invites',
  'prisma.callEvent': 'prisma.call_events',
};

// Field mappings for create/update operations
const fieldMappings = {
  'userId': 'user_id',
  'sessionId': 'session_id',
  'callSid': 'call_sid',
  'phoneNumber': 'phone_number',
  'fromNumber': 'from_number',
  'toNumber': 'to_number',
  'recordingEnabled': 'recording_enabled',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'emailVerified': 'email_verified',
  'emailVerifiedAt': 'email_verified_at',
  'phoneVerified': 'phone_verified',
  'jobTitle': 'job_title',
  'avatarUrl': 'avatar_url',
  'twoFactorEnabled': 'two_factor_enabled',
  'twoFactorSecret': 'two_factor_secret',
  'lastLoginAt': 'last_login_at',
  'lastLoginIp': 'last_login_ip',
  'loginCount': 'login_count',
  'failedLoginCount': 'failed_login_count',
  'lockedUntil': 'locked_until',
  'creditBalance': 'credit_balance',
  'stripeCustomerId': 'stripe_customer_id',
  'deletedAt': 'deleted_at',
  'transactionType': 'transaction_type',
  'paymentId': 'payment_id',
  'stripePaymentId': 'stripe_payment_id',
  'callLogId': 'call_log_id',
  'recordingSid': 'recording_sid',
  'recordingUrl': 'recording_url',
  'publicUrl': 'public_url',
  'transcriptionUrl': 'transcription_url',
  'isActive': 'is_active',
  'lastUsedAt': 'last_used_at',
  'usageCount': 'usage_count',
  'isPublic': 'is_public',
  'isTemplate': 'is_template',
  'sessionToken': 'session_token',
  'userAgent': 'user_agent',
  'lastActivity': 'last_activity',
  'providerId': 'provider_id',
  'providerAccountId': 'provider_account_id',
  'refreshToken': 'refresh_token',
  'accessToken': 'access_token',
  'expiresAt': 'expires_at',
  'tokenType': 'token_type',
  'idToken': 'id_token',
  'sessionState': 'session_state',
  'creditsUsed': 'credits_used',
  'errorRate': 'error_rate',
};

// Import type mappings
const typeMappings = {
  "'@prisma/client'": {
    'User': 'users'
  }
};

// Get all TypeScript and JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['node_modules/**', 'dist/**', '.next/**', 'scripts/fix-prisma-references.js']
});

console.log(`Found ${files.length} files to process`);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Replace Prisma model references
  Object.entries(replacements).forEach(([old, replacement]) => {
    const regex = new RegExp(old.replace('.', '\\.'), 'g');
    if (content.match(regex)) {
      content = content.replace(regex, replacement);
      modified = true;
      console.log(`  Fixed ${old} -> ${replacement} in ${file}`);
    }
  });

  // Fix import statements
  Object.entries(typeMappings).forEach(([module, mappings]) => {
    Object.entries(mappings).forEach(([oldType, newType]) => {
      const importRegex = new RegExp(`from ${module}.*{[^}]*\\b${oldType}\\b[^}]*}`, 'g');
      const matches = content.match(importRegex);
      if (matches) {
        matches.forEach(match => {
          const newMatch = match.replace(new RegExp(`\\b${oldType}\\b`, 'g'), newType);
          content = content.replace(match, newMatch);
          modified = true;
          console.log(`  Fixed import ${oldType} -> ${newType} in ${file}`);
        });
      }
    });
  });

  // Fix field names in object literals
  Object.entries(fieldMappings).forEach(([old, replacement]) => {
    // Match field in object literals: { fieldName: value } or fieldName,
    const regex1 = new RegExp(`([{,\\s])${old}:`, 'g');
    if (content.match(regex1)) {
      content = content.replace(regex1, `$1${replacement}:`);
      modified = true;
      console.log(`  Fixed field ${old} -> ${replacement} in ${file}`);
    }

    // Match field in where/data objects
    const regex2 = new RegExp(`\\.${old}([,\\s}])`, 'g');
    if (content.match(regex2)) {
      content = content.replace(regex2, `.${replacement}$1`);
      modified = true;
      console.log(`  Fixed accessor .${old} -> .${replacement} in ${file}`);
    }
  });

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Updated ${file}`);
  }
});

console.log('Done!');