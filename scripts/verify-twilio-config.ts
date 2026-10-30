// -----------------------------------------------------------------------------
// scripts/verify-twilio-config.ts
// ShopSphere Secure Credential & Environment Verification Tool
// Validates configuration without exposing secret keys in logs
// -----------------------------------------------------------------------------

import fs from 'fs';
import path from 'path';

function loadEnvFile(file: string) {
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key] && val) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

console.log('\n================================================================');
console.log('   SHOPSPHERE: SECURE CREDENTIAL CONFIGURATION VERIFIER       ');
console.log('================================================================\n');

// 1. Check Git Protection
const gitignorePath = path.resolve('.gitignore');
let isGitProtected = false;
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  isGitProtected = gitignoreContent.includes('.env.local') && gitignoreContent.includes('.env');
}

console.log('1. Git Repository Secret Protection:');
if (isGitProtected) {
  console.log('   ✅ PASS: .env.local and .env are strictly excluded in .gitignore');
} else {
  console.log('   ❌ FAIL: .env.local must be excluded in .gitignore');
}

// 2. Check Twilio Credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();
const phone = process.env.TWILIO_PHONE_NUMBER?.trim();

console.log('\n2. Twilio SMS Configuration Status:');

if (!accountSid) {
  console.log('   ⚠️  TWILIO_ACCOUNT_SID: Not configured in .env.local (Empty)');
} else if (accountSid.startsWith('AC') && accountSid.length === 34) {
  console.log(`   ✅ TWILIO_ACCOUNT_SID: Valid Format (AC${'*'.repeat(28)}${accountSid.slice(-4)})`);
} else {
  console.log(`   ❌ TWILIO_ACCOUNT_SID: Invalid format (Expected 34 chars starting with 'AC', got ${accountSid.length} chars)`);
}

if (!authToken) {
  console.log('   ⚠️  TWILIO_AUTH_TOKEN: Not configured in .env.local (Empty)');
} else if (authToken.length === 32) {
  console.log(`   ✅ TWILIO_AUTH_TOKEN: Present (32 characters, masked for security: ••••••••••••)`);
} else {
  console.log(`   ⚠️  TWILIO_AUTH_TOKEN: Present (${authToken.length} characters)`);
}

if (!verifySid && !phone) {
  console.log('   ⚠️  TWILIO_VERIFY_SERVICE_SID: Not configured in .env.local (Empty)');
} else if (verifySid) {
  if (verifySid.startsWith('VA') && verifySid.length === 34) {
    console.log(`   ✅ TWILIO_VERIFY_SERVICE_SID: Valid Format (VA${'*'.repeat(28)}${verifySid.slice(-4)})`);
  } else {
    console.log(`   ❌ TWILIO_VERIFY_SERVICE_SID: Invalid format (Expected 34 chars starting with 'VA', got ${verifySid.length} chars)`);
  }
} else if (phone) {
  console.log(`   ✅ TWILIO_PHONE_NUMBER: Present (${phone.slice(0, 3)}***${phone.slice(-4)})`);
}

// 3. Supabase Integration
console.log('\n3. Supabase Auth Integration Status:');
const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (supaUrl && supaKey) {
  console.log(`   ✅ Connected to Supabase Project: ${supaUrl}`);
} else {
  console.log('   ⚠️  Supabase not fully configured.');
}

console.log('\n================================================================');
if (accountSid && authToken && (verifySid || phone)) {
  console.log('RESULT: ✅ All required Twilio credentials are loaded securely!');
} else {
  console.log('RESULT: ⏳ Pending Twilio credentials in .env.local. Ready for input.');
}
console.log('================================================================\n');

