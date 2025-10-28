// functions/get_system_health/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SystemHealth } from "../../types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- ENVIRONMENT VARIABLES ---
// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// @ts-ignore
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// @ts-ignore
const SITE_URL = Deno.env.get("SITE_URL");
// @ts-ignore
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
    const supabaseClient = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user || user.app_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Forbidden: Not an admin" }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Perform health checks
    const health: SystemHealth = {
      siteUrl: {
        status: SITE_URL ? 'ok' : 'warn',
        message: SITE_URL ? `Configurado: ${SITE_URL}` : 'La variable SITE_URL no está configurada. Los enlaces en los correos pueden no funcionar.',
      },
      supabaseRedirects: {
        status: SUPABASE_URL ? 'ok' : 'error',
        message: SUPABASE_URL ? 'La URL de Supabase está configurada.' : 'Error crítico: La variable SUPABASE_URL no está configurada.',
      },
      smtp: {
        status: RESEND_API_KEY ? 'ok' : 'warn',
        message: RESEND_API_KEY ? 'La clave de Resend (SMTP) está configurada.' : 'La variable RESEND_API_KEY no está configurada. El envío de correos no funcionará.',
      },
    };

    // 3. Return success response
    return new Response(JSON.stringify({ ok: true, health }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
