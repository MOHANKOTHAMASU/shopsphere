import { createClient } from '@supabase/supabase-js';
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
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function checkJwtRole(key: string, label: string) {
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      console.log(`[JWT check] ${label} -> role: ${payload.role}, iss: ${payload.iss}, ref: ${payload.ref || payload.sub}`);
    } catch (e) {
      console.log(`[JWT check] ${label} -> parse error: ${(e as Error).message}`);
    }
  } else {
    console.log(`[JWT check] ${label} -> not 3 parts, length: ${parts.length}`);
  }
}

checkJwtRole(anonKey, 'Anon Key');
checkJwtRole(serviceKey, 'Service Key');

async function main() {
  if (!url || !serviceKey) {
    console.log('Supabase credentials missing.');
    return;
  }
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false }
  });

  try {
    const { data: users, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 5 });
    if (error) {
      console.error('List users error:', error.message);
    } else {
      console.log('Successfully connected to Supabase Auth! User count:', users.users.length);
      users.users.forEach((u) => {
        console.log(`- ${u.email} (id: ${u.id}, phone: ${u.phone || 'none'}, confirmed: ${u.email_confirmed_at || 'NO'})`);
      });
    }

    // Test anon client signInWithOtp with phone to check what Supabase says for Phone SMS provider
    const anonClient = createClient(url, anonKey, {
      auth: { persistSession: false }
    });
    console.log('\nTesting Supabase Phone Auth OTP send...');
    const { data: otpData, error: otpError } = await anonClient.auth.signInWithOtp({
      phone: '+919652788899', // From user's screenshot
    });
    if (otpError) {
      console.log('Supabase signInWithOtp (Phone) Error:', otpError.status, otpError.message);
    } else {
      console.log('Supabase signInWithOtp (Phone) Success:', otpData);
    }

    // Test anon client signUp with email to check what Supabase says for Email Confirmation
    console.log('\nTesting Supabase Email Auth SignUp...');
    const testEmail = `shopsphere.tester.${Date.now()}@gmail.com`;
    const { data: signupData, error: signupError } = await anonClient.auth.signUp({
      email: testEmail,
      password: 'TestPassword@123',
    });
    if (signupError) {
      console.log('Supabase signUp (Email) Error:', signupError.status, signupError.message, (signupError as any).code);
    } else {
      console.log('Supabase signUp (Email) Success:', signupData.user?.email, 'Confirmed at:', signupData.user?.email_confirmed_at);
      console.log('Session present:', Boolean(signupData.session));
      console.log('User identities:', signupData.user?.identities);
    }
  } catch (err: unknown) {
    console.error('Unexpected error:', (err as Error).message);
  }
}

main();
