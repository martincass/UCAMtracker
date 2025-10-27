// FIX: Removed Deno-specific reference paths causing local TS errors.
// These are not needed for deployment and break local type checking.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers to allow requests from the web app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- ENVIRONMENT VARIABLES ---
// These must be set in the Supabase Edge Function settings
// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// @ts-ignore
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// @ts-ignore
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// @ts-ignore
const FROM_ADDRESS = Deno.env.get("FROM_ADDRESS") || "onboarding@resend.dev";
// @ts-ignore
const SITE_URL = Deno.env.get("SITE_URL") || "https://app.example.com";

/**
 * Generates a cryptographically secure random password.
 * @param length The desired length of the password.
 * @returns A randomly generated password string.
 */
function generateSecurePassword(length = 14): string {
  const charsets = {
    uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
    lowercase: 'abcdefghijkmnpqrstuvwxyz',
    numbers: '23456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };
  
  const allChars = Object.values(charsets).join('');
  let password = '';

  // Ensure at least one character from each set for strength
  password += charsets.uppercase[crypto.getRandomValues(new Uint32Array(1))[0] % charsets.uppercase.length];
  password += charsets.lowercase[crypto.getRandomValues(new Uint32Array(1))[0] % charsets.lowercase.length];
  password += charsets.numbers[crypto.getRandomValues(new Uint32Array(1))[0] % charsets.numbers.length];
  password += charsets.symbols[crypto.getRandomValues(new Uint32Array(1))[0] % charsets.symbols.length];

  // Fill the rest of the password length
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.getRandomValues(new Uint32Array(1))[0] % allChars.length];
  }

  // Shuffle the password to randomize the order of the guaranteed characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Sends a welcome email to the new user using the Resend API.
 * @returns An object indicating success or failure with an error message.
 */
async function sendWelcomeEmail(to: string, client_name: string, password_cleartext: string): Promise<{ sent: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    const errorMsg = "RESEND_API_KEY not set";
    console.warn(`Skipping email send: ${errorMsg}`);
    return { sent: false, error: errorMsg };
  }
  
  const emailText = `Hola ${client_name},

Tu cuenta fue creada.
Email: ${to}
Contraseña temporal: ${password_cleartext}

Ingresá en ${SITE_URL || ''}/login y cambiá tu contraseña.

Saludos,
Soporte`;
  
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject: 'Bienvenido a Tracker de Producción',
        text: emailText,
      }),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      const errorMsg = `HTTP ${res.status}: ${errorText}`;
      console.error("Resend API error:", errorMsg);
      return { sent: false, error: errorMsg };
    }
    
    console.log(`Email sent successfully to ${to}`);
    return { sent: true };
  } catch (error) {
    const errorMsg = `Network or fetch error: ${error.message}`;
    console.error("Failed to send email via Resend:", error);
    return { sent: false, error: errorMsg };
  }
}

/**
 * Main server handler for the Edge Function.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authorization: Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(SUPABASE_URL, SERVICE_KEY); // Use service key for auth check
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user || user.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Forbidden: Not an admin" }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Input validation
    const { email, client_id, client_name } = await req.json();
    if (!email || !client_id || !client_name) {
      return new Response(JSON.stringify({ error: "Missing required fields: email, client_id, client_name" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const emailNorm = String(email).trim().toLowerCase();

    // 3. Generate password
    const password = generateSecurePassword(14);
    
    // 4. Create auth user (using admin client)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: emailNorm,
      password: password,
      email_confirm: true,
      app_metadata: { role: 'user' },
      user_metadata: { client_id: client_id, client_name: client_name },
    });
    if (createError) throw new Error(`Supabase Auth Error: ${createError.message}`);
    const newUserId = createData.user?.id;
    if (!newUserId) throw new Error("User creation failed to return a user ID.");

    // 5 & 6. Upsert allowlist and profiles
    const { error: allowlistError } = await supabaseAdmin.from('allowlist_clients').upsert({ email: emailNorm, client_id, client_name, active: true }, { onConflict: 'email' });
    if (allowlistError) throw new Error(`Allowlist upsert failed: ${allowlistError.message}`);

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({ user_id: newUserId, email: emailNorm, role: 'user', client_id, client_name, must_reset_password: true }, { onConflict: 'user_id' });
    if (profileError) throw new Error(`Profile upsert failed: ${profileError.message}`);
    
    // 7. Send welcome email and get diagnostics
    const emailResult = await sendWelcomeEmail(emailNorm, client_name, password);

    // 8. Return success response with email diagnostics
    const responsePayload = {
      ok: true,
      user_id: newUserId,
      email: emailNorm,
      client_id: client_id,
      client_name: client_name,
      email_sent: emailResult.sent,
      ...(emailResult.sent === false && { 
          email_error: emailResult.error,
          password: password // Only return password if email failed
      }),
    };

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});