import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('=============================================================');
  console.log('  SHOPSPHERE: TRUSTED ADMIN ACCOUNT PROVISIONING TOOL');
  console.log('=============================================================');

  if (!email) {
    console.error('❌ Error: Admin email is required.');
    console.log('\nUsage:');
    console.log('  npx.cmd tsx scripts/promote-admin.ts <admin-email> [temporary-password]');
    console.log('\nExamples:');
    console.log('  # Promote an existing user by email:');
    console.log('  npx.cmd tsx scripts/promote-admin.ts admin@shopsphere.com');
    console.log('\n  # Create a brand new admin user directly:');
    console.log('  npx.cmd tsx scripts/promote-admin.ts admin@shopsphere.com "SecurePass123!"');
    process.exit(1);
  }

  if (!supabaseUrl || !serviceRoleKey || supabaseUrl.includes('placeholder') || serviceRoleKey.includes('placeholder')) {
    console.error('❌ Error: Live Supabase credentials not found in environment.');
    console.error('Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.');
    console.log('\nAlternative SQL command to run directly in Supabase SQL Editor:');
    console.log('-------------------------------------------------------------');
    console.log(`UPDATE public.profiles\nSET role = 'admin'\nWHERE id IN (\n  SELECT id FROM auth.users WHERE email = '${email.trim().toLowerCase()}'\n);`);
    console.log('-------------------------------------------------------------');
    process.exit(1);
  }

  // Initialize administrative Supabase client using Service Role Key
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const normalizedEmail = email.trim().toLowerCase();
  console.log(`\n🔍 Searching for user: ${normalizedEmail}...`);

  // Find user by email
  const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) {
    console.error(`❌ Failed to list users: ${listError.message}`);
    process.exit(1);
  }

  let targetUser = usersData.users.find(
    (u) => u.email?.toLowerCase() === normalizedEmail
  );

  // If user does not exist and password was provided, create the user
  if (!targetUser) {
    if (password) {
      console.log(`Creating new user account for ${normalizedEmail}...`);
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: 'Store Administrator',
        },
      });

      if (createError || !createData.user) {
        console.error(`❌ Failed to create user: ${createError?.message}`);
        process.exit(1);
      }
      targetUser = createData.user;
      console.log(`✔ User account created (ID: ${targetUser.id}).`);
    } else {
      console.error(`❌ User with email "${normalizedEmail}" was not found.`);
      console.log('Provide a password as the second argument to create this user immediately:');
      console.log(`  npx.cmd tsx scripts/promote-admin.ts ${normalizedEmail} "SecurePassword123!"`);
      process.exit(1);
    }
  }

  // Update profile role in public.profiles to 'admin'
  console.log(`Assigning 'admin' role to profile (User ID: ${targetUser.id})...`);
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({
      id: targetUser.id,
      role: 'admin',
      full_name: targetUser.user_metadata?.full_name || 'Store Administrator',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (profileError) {
    console.error(`❌ Failed to assign admin role: ${profileError.message}`);
    process.exit(1);
  }

  // Record audit log
  await adminClient.from('admin_audit_logs').insert({
    admin_id: targetUser.id,
    admin_email: normalizedEmail,
    action: 'ADMIN_PROMOTION',
    resource_type: 'USER',
    resource_id: targetUser.id,
    details: {
      method: 'CLI_SERVICE_ROLE',
      timestamp: new Date().toISOString(),
    },
  });

  console.log('\n=============================================================');
  console.log(`🎉 SUCCESS: ${normalizedEmail} is now a verified Store Administrator!`);
  console.log('You can now log in at: /admin/login');
  console.log('=============================================================');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
