// scripts/seed.mjs
// This script seeds the initial admin user for the application.
// It uses the Supabase Admin API to bypass RLS.
// Run with: pnpm seed:admin

import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// Admin credentials are hardcoded to ensure a consistent superuser state.
const adminEmail = "mcassinelli@gmail.com";
const adminPassword = "12E4!";

// Supabase credentials are still read from the environment.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;


// --- VALIDATION ---
if (!supabaseUrl || !serviceRoleKey) {
  console.error("🔴 Error: Missing required environment variables. Please check your .env file for VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  // @ts-ignore
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
      console.log(`🟡 Admin user ${adminEmail} already exists. Updating password and ensuring admin role.`);
      // 2a. Update the existing user's password and metadata
      const { data, error: updateError } = await supabase.auth.admin.updateUserById(
        adminUser.id,
        {
          password: adminPassword,
          email_confirm: true,
          app_metadata: { role: 'admin' },
          user_metadata: { client_id: 'ADMIN' }
        }
      );
      if (updateError) throw updateError;
      adminUser = data.user;
      console.log(`✅ Successfully updated admin user: ${adminUser.email}`);

    } else {
      // 2b. Create the user if they don't exist
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

    // 3. Ensure the admin user is on the allowlist (UPSERT logic)
    const { error: upsertError } = await supabase
      .from('allowlist_clients')
      .upsert({
        email: adminEmail,
        client_id: 'ADMIN',
        client_name: 'Admin',
        active: true,
      }, { onConflict: 'email' });

    if (upsertError) throw upsertError;
    console.log(`✅ Successfully ensured admin user is on the allowlist.`);


    console.log("✨ Seed process completed successfully!");

  } catch (error) {
    console.error("🔴 An error occurred during the seed process:", error.message);
    // @ts-ignore
    process.exit(1);
  }
}

seedAdmin();