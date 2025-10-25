// scripts/seed.mjs
// This script seeds the initial admin user for the application.
// It uses the Supabase Admin API to bypass RLS.
// Run with: pnpm seed:admin

// FIX: Import `process` module to provide types for `process.exit`, resolving errors at lines 19 and 88.
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// Note: The seed script runs in Node.js and can access process.env directly.
// We use VITE_SUPABASE_URL for consistency with the client-side code.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

// --- VALIDATION ---
if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword) {
  console.error("🔴 Error: Missing required environment variables. Please check your .env file for VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD.");
  process.exit(1);
}

// Initialize Supabase admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log("🌱 Starting admin user seed process...");

async function seedAdmin() {
  try {
    // 1. Check if user already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ email: adminEmail });
    if (listError) throw listError;
    
    let adminUser = users.find(u => u.email === adminEmail);

    if (adminUser) {
      console.log(`🟡 Admin user ${adminEmail} already exists. Skipping user creation.`);
    } else {
      // 2. Create the user if they don't exist
      const { data, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Auto-confirm the email
        app_metadata: {
          role: 'admin', // Custom metadata to define the user's role
        },
        user_metadata: {
          client_id: 'ADMIN', // Custom metadata for client identification
        }
      });
      if (createError) throw createError;
      adminUser = data.user;
      console.log(`✅ Successfully created admin user: ${adminUser.email}`);
    }

    // 3. Ensure the admin user is on the allowlist
    const { data: allowlistEntry, error: selectError } = await supabase
      .from('allowlist_clients')
      .select('id')
      .eq('email', adminEmail)
      .maybeSingle();

    if (selectError) throw selectError;

    if (allowlistEntry) {
      console.log(`🟡 Admin user ${adminEmail} is already on the allowlist.`);
    } else {
      const { error: insertError } = await supabase
        .from('allowlist_clients')
        .insert({
          email: adminEmail,
          client_id: 'ADMIN',
          client_name: 'Admin',
          active: true,
        });
      if (insertError) throw insertError;
      console.log(`✅ Successfully added admin user to the allowlist.`);
    }

    console.log("✨ Seed process completed successfully!");

  } catch (error) {
    console.error("🔴 An error occurred during the seed process:", error.message);
    process.exit(1);
  }
}

seedAdmin();